---
title: Swarm：OpenAI 极简多 Agent 编排框架
subtitle: 用最少的抽象，把 Agent 编排的骨架讲清楚
date: 2026-05-24
category: 全球热门 Agent 产品
tags: [swarm, openai, agent, multi-agent, handoff]
status: 已定稿
readtime: 10 min
---

## TL;DR

> [!tldr] 一句话
> Swarm 不是生产级 Agent 平台，而是一个把「Agent 编排最小闭环」暴露得极清楚的教学框架：Agent、工具调用、上下文更新、Handoff、循环退出，五个概念，一个文件就能说清楚。

## 它解决什么问题

Swarm 解决的不是「如何做一个完整生产级 Agent 平台」，而是**多 Agent 协作最小闭环到底长什么样**。

在 Agent 系统里，常见问题包括：

1. 一个 Agent 什么时候该调用工具？
2. 工具调用结果怎么回到大模型？
3. 多个 Agent 之间怎么交接任务？
4. 一轮任务执行到什么时候应该停止？
5. 对话历史和业务上下文分别放在哪里？

Swarm 用非常少的抽象把这些问题串起来，核心实体只有四个：

| 实体 | 职责 |
|------|------|
| `Swarm` | 负责调度 Agent Loop |
| `Agent` | 定义角色、模型、指令和工具 |
| `Response` | 承载一次运行后的整体结果 |
| `Result` | 封装单个工具函数的返回值、上下文变化和可能的 Handoff |

## 最小例子：Agent Loop

把 Swarm 想成一个小型任务调度台：

```text
用户提出任务
    ↓
Swarm 启动当前 Agent
    ↓
Agent 思考: 直接回答还是调用工具？
    ↓
如果调用工具，Swarm 执行真实函数
    ↓
工具结果写回对话历史和上下文
    ↓
如果工具返回新 Agent，进入 Handoff
    ↓
直到没有工具调用或达到最大轮数
```

这就是 Swarm 最核心的 **Agent Loop**。

## 数字推导：一次 run() 的状态变化

假设一次 `run()` 初始状态：

- `active_agent = SalesAgent`
- `history = 用户消息`
- `context_variables = {"customer_type": "enterprise"}`
- `max_turns = 5`

运行过程：

```python
# 第 1 轮：SalesAgent 认为需要查询报价
response = llm(SalesAgent.instructions, history)
# → tool_calls: [{"name": "get_quote", "args": {...}}]

# Swarm 执行工具函数
result = get_quote(customer_type="enterprise")
# → Result(value="报价已生成",
#          context_variables={"quote_id": "Q001"},
#          agent=SupportAgent)  # Handoff!

# Swarm 更新状态
history.append(tool_result)
context_variables.update({"quote_id": "Q001"})
active_agent = SupportAgent  # 切换 Agent

# 第 2 轮：SupportAgent 继续处理…
```

关键区别：

- `history` → 给 **LLM** 看，记录「说了什么、做了什么」
- `context_variables` → 给 **工具和代码** 看，记录「关键业务状态」

## Handoff 的本质

> [!important] 核心洞见
> Handoff 不是复杂工作流引擎。本质只是：某个工具函数返回了一个新的 Agent 对象，Swarm 把 `active_agent` 指向它，下一轮循环就由新 Agent 继续。

```python
def transfer_to_support(context_variables: dict) -> Agent:
    """这就是 Handoff：工具函数返回新 Agent"""
    return SupportAgent

sales_agent = Agent(
    name="SalesAgent",
    instructions="你是销售助手...",
    tools=[get_quote, transfer_to_support]
)
```

## 类比（含边界）

**类比**：前台调度员 + 专家小组

准确的地方：
- 前台负责把任务派给合适的人
- 每个专家有自己的身份、说明书和能力清单
- 专家可以做事，也可以把任务转交给另一个专家
- 任务过程会留下记录，方便下一位专家接着处理

会误导的地方：
- Swarm 里的 Agent 不是独立进程，更像是带不同 instructions 和 tools 的**配置对象**
- Handoff 不是复杂工作流引擎，本质只是工具函数返回新 Agent
- Swarm **不自动判断「用户目标是否真正完成」**，主要根据是否还有工具调用来决定循环是否继续

## 不适合 Swarm 的场景

> [!warning] 生产使用警告
> Swarm 是教学/原型框架，以下场景不适合直接使用 Swarm：强状态机控制的复杂工作流、需要长期记忆和断点恢复的生产系统、需要严格结果验证和审计日志的高可靠业务、需要可视化编排和复杂并发调度的 Agent 平台。

## 我现在还不懂的地方

- Swarm 的 streaming 机制在 Tool Call 和 Handoff 混合时如何保持输出一致性
- `tool_choice` 不同策略对 Agent Loop 退出行为的具体影响
- Handoff 后新 Agent 是否应该完整继承旧 `history`，以及如何控制 token 膨胀
- 如何在 Swarm 的极简结构上添加生产级 Guardrails，同时不破坏它的简洁性

## 知识关联

**上游依赖**：Function Calling、Tool Calling、Agent Loop

**下游延伸**：LangGraph（状态机编排）、AutoGen（多 Agent 对话）、OpenAI Agents SDK（生产级继任者）、Agent 记忆机制、Agent 任务验证机制
