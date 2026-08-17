# dsh-model-alias

DSH 插件：**提供商范围内的模型名映射**。

## 解决的问题

DSH 的 LLM 适配器（`dsh-llm-pi-ai` / pi-ai）把模型元数据（思考等级、最大输出 token、上下文窗口）和**线上请求里的模型名**绑定在同一个模型 ID 上——"harness 的模型名就是线上模型名"。当某个提供商实际服务的模型 ID 与 DSH 认知的 ID 不一致时（例如网关只认 `deepseek-v4-flash-0731`，而 DSH 侧希望按 `deepseek-v4-flash` 使用其思考等级/输出上限元数据），就无法两全。

本插件把两者解耦：**DSH 内部**（会话记录、模型选择器、思考等级、maxTokens、上下文窗口）始终使用映射前的模型名，**发给提供商的 HTTP 请求体**里携带映射后的真实模型名。

## 机制

- 包装 `ctx.llm.adapters` 中 pi-ai 适配器的 `current()`，对每个快照的 pi-ai `Models` 集合的 `streamSimple`/`stream` 打一次补丁，注入 `onPayload`。
- pi-ai 的所有协议（openai-completions / openai-responses / anthropic-messages / bedrock / google …）在发送前都会调用 `options.onPayload(payload, model)`，本插件在其中改写 `payload.model`（bedrock 为 `modelId`），其余字段原样保留。
- 映射表在每次请求时通过闭包读取，**只改映射配置无需重新武装**，下一个请求即生效。
- 监听 `llm/adapters-updated`，适配器注册变化（HMR 重载、路由编辑）时重新武装。
- 未命中的模型、不可改写的 payload 一律原样放行；与已有 `onPayload` 钩子（其他插件注入的）自动组合。

## 安装

```bash
# 1. 把本仓库链接到 DSH 的本地插件目录（scoped 包名为两级目录）
mkdir -p "$HOME/.dsh/profiles/node_modules/@kongjianguan"
ln -s "$PWD" "$HOME/.dsh/profiles/node_modules/@kongjianguan/dsh-model-alias"

# 2. 在 ~/.dsh/profiles/web/cordis.patch.yml 追加：
# - insert:
#   - id: dsh-model-alias
#     name: '@kongjianguan/dsh-model-alias'

# 3. 重启 DSH（或等待 patch 热重载）
```

从 npm 安装（发布后，二选一，替代本地链接）：

```bash
cd ~/.dsh/profiles/web && pnpm add @kongjianguan/dsh-model-alias
# patch 的 name 用 '@kongjianguan/dsh-model-alias'，然后重启 DSH
```

> 早期版本先后以 `@local/dsh-model-alias`、`dsh-model-alias` 链接安装；迁移到
> 当前 scoped 包名时，删除旧的 `node_modules/dsh-model-alias` 链接并把 patch 的
> `name` 改为 `@kongjianguan/dsh-model-alias` 即可（旧名与包名不一致会破坏
> loader/HMR 的归属判定）。

## 配置

`~/.dsh/settings.yaml`（推荐）或 cordis.patch.yml 的 entry config（作为 base，settings 存在时被覆盖）：

```yaml
dsh-model-alias:
  providers:
    token-rhythm:
      deepseek-v4-flash: deepseek-v4-flash-0731   # DSH 看到的模型名 -> 实际请求的模型名
```

### WebUI 设置界面

插件带一个浏览器端配置页：WebUI 的 **设置 → 模型别名**（英文界面为 Model Alias，排在“插件”/OpenCode 用量之间）。页面以表格编辑 `providers` 映射（提供商路由 / DSH 侧模型名 / 线上模型名），并支持：

- 增删行、逐行覆盖入口配置（`cordis.patch.yml` 提供的条目带“入口”标记，属于只读底座）；
- **保存**：写入 `~/.dsh/settings.yaml` 的 `dsh-model-alias` 段，带修订号并发保护；无需重启，下一个请求即生效；
- **恢复默认**：清除本机设置段，映射回到入口配置（或为空）；
- 与并发修改冲突（其他窗口/进程改动配置）时提示重新载入后再试。

浏览器端代码随插件包提供（`lib/client.js`，声明在 `dsh.client` 与 `exports["./client"]`），DSH 启动时自动注册该设置页；新增该入口后需要重启一次 DSH，让服务器发现新的 client 插件。

配合 `llm-pi-ai` 的模型条目使用：DSH 侧的 `id` 保持 DSH 认知的名字，并把思考等级等元数据声明在 `reasoningEfforts` 里（pi-ai 目录按提供商路由索引，自定义路由不会自动继承目录元数据）：

```yaml
llm-pi-ai:
  providers:
    token-rhythm:
      displayName: Token Rhythm
      apiKeyEnv: TOKEN_RHYTHM_API_KEY
      api: openai-completions
      baseURL: https://tokenrhythm.studio/v1
      models:
        - id: deepseek-v4-flash          # DSH 侧名字（有思考等级/输出上限元数据）
          name: DeepSeek V4 Flash
          contextWindow: 1000000
          maxTokens: 384000
          reasoningEfforts:
            off:                          # 空值 = 支持但不发送该参数
            high: high
            max: max
```

## 验证

```bash
pnpm test        # 单元测试 + 冒烟测试（本地 mock OpenAI 端点，走真实 pi-ai 链路）
```

插件日志（`dsh-model-alias: <provider>/<model> requested as <wire> on the wire`）会在每个映射首次命中时输出一次；未知提供商路由会告警。

## 发布为 npm 插件

包名已是可发布形态（`@kongjianguan/dsh-model-alias`，无 `private`，含 `repository`/`homepage` 与 `LICENSE`）。发布前只需：

1. **按语义化版本设置 `version`**（当前 `0.1.0`）。
2. **声明 peerDependencies**（可选但推荐，便于 npm 校验）：`@deepseek-ai/dsh-settings` 与 `@deepseek-ai/schemastery`（dsh 环境自带；缺失时插件会自动降级为 entry-config-only 模式，见 `lib/index.js` 的 `profileRequire`）。
3. **发布**：`npm publish`（或 `pnpm publish`）。

本地链接安装与包名一致（`node_modules/@kongjianguan/dsh-model-alias`），发布后既可以从 npm 安装，也可以继续用链接方式开发，两条路径互不冲突。

包内不含测试所需的本地路径依赖（冒烟测试的 pi-ai 引用走 profile 的 node_modules 链，仅本地测试需要）。

## 局限

- 只作用于 pi-ai 适配器（`dsh-llm-pi-ai`）服务的提供商路由；其他适配器（如官方 `dsh-llm-deepseek`）不受影响。
- 映射是精确 ID 匹配，不支持通配符/前缀规则。
- 依赖 pi-ai 的 `onPayload` 钩子与 `Models.streamSimple` 公开接口；pi-ai 大版本升级时需回归验证。
