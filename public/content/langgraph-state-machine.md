---
title: LangGraph：用状态机思维编排 Agent 工作流
subtitle: 从 DAG 到 Cycle Graph，LangChain 生态里最成熟的 Agent 编排层
date: 2026-05-20
category: 全球热门 Agent 产品
tags: [langgraph, langchain, agent, state-machine, workflow]
status: 已定稿
readtime: 12 min
---

## TL;DR

> [!tldr] 一句话
> LangGraph 把 Agent 工作流建模为**有状态的循环图**（Stateful Cyclic Graph），支持条件边、断点、持久化和流式输出，是目前 LangChain 生态里处理复杂 Agent 流程最成熟的编排层。

## 它解决什么问题

简单的 Agent 系统（如 Swarm）只有一个 Agent Loop：调用 LLM → 调用工具 → 重复。但生产场景的需求远不止这些：

1. **分支**：不同条件走不同的 Agent 路径
2. **循环**：需要反复验证、修正直到达标
3. **并行**：多个子任务同时处理
4. **断点恢复**：长任务中途失败后从检查点继续
5. **人在环路**：某些步骤需要人类审批才能继续
6. **状态持久化**：跨多轮对话保持上下文

LangGraph 用**图（Graph）**来建模这些需求：节点是处理单元，边是控制流，状态是贯穿整个图的共享数据。

## 核心概念

### StateGraph：有状态的图

```python
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
import operator

# 定义全局状态
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]  # 消息历史（追加）
    next_step: str                            # 控制流
    retry_count: int                          # 重试计数
    result: str                               # 最终结果

graph = StateGraph(AgentState)
```

### 节点（Node）

每个节点是一个函数，接收当前状态，返回状态的**增量更新**：

```python
def research_agent(state: AgentState) -> dict:
    """调用搜索工具收集信息"""
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response], "next_step": "validate"}

def validate_result(state: AgentState) -> dict:
    """验证研究结果是否充分"""
    is_good = judge_llm.invoke(state["messages"])
    if is_good and state["retry_count"] < 3:
        return {"next_step": "research", "retry_count": state["retry_count"] + 1}
    return {"next_step": "end"}

graph.add_node("research", research_agent)
graph.add_node("validate", validate_result)
```

### 条件边（Conditional Edge）

```python
def route(state: AgentState) -> str:
    return state["next_step"]

graph.add_conditional_edges("validate", route, {
    "research": "research",  # 验证失败 → 重新研究
    "end": END               # 验证通过 → 结束
})
```

## 与 Swarm 的对比

| 特性 | Swarm | LangGraph |
|------|-------|-----------|
| 复杂度 | 极简，1个文件 | 较复杂，需要建模 |
| 循环支持 | 基础 Agent Loop | 任意有向图 |
| 状态持久化 | ❌ | ✅ Checkpointer |
| 断点恢复 | ❌ | ✅ |
| 人在环路 | ❌ | ✅ interrupt_before/after |
| 流式输出 | 有限 | ✅ 完整支持 |
| 适合场景 | 学习/原型 | 生产级 Agent |

## 断点与人在环路

> [!important] 核心特性
> LangGraph 的 `interrupt_before` 可以在任意节点前暂停，等待人类输入后再继续。这是 Swarm 等简单框架无法实现的。

```python
# 编译图时设置断点
compiled = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["publish"]  # 发布前需要人工审批
)

# 运行到断点
result = compiled.invoke(initial_state, config={"thread_id": "task-001"})
# → 状态保存到 checkpointer，等待人工审批

# 人工审批后继续
result = compiled.invoke(None, config={"thread_id": "task-001"})
```

## 并行子图

LangGraph 支持在同一个图里并行执行多个分支：

```python
# 并行研究多个方向
graph.add_node("research_a", agent_a)
graph.add_node("research_b", agent_b)
graph.add_node("merge", merge_results)

# A 和 B 并行，然后汇入 merge
graph.add_edge("start", "research_a")
graph.add_edge("start", "research_b")
graph.add_edge("research_a", "merge")
graph.add_edge("research_b", "merge")
```

## 类比

把 LangGraph 比作**工厂流水线控制系统**：

- **状态**：当前生产批次的所有参数（材料用量、质检结果、工序编号）
- **节点**：每道工序（切割、焊接、质检、包装）
- **条件边**：质检不合格 → 返工，合格 → 下一工序
- **断点**：特殊工序需要工厂主管人工签字才能继续
- **持久化**：如果工厂停电，重启后从上次检查点继续，不用全部重做

边界：真实工厂的流水线是物理并行的，LangGraph 的并行是异步任务并发，底层还是 Python 事件循环。

## 我现在还不懂的地方

- LangGraph 在超大规模状态（百万 token 对话历史）下的 checkpointer 性能
- Sub-graph 和父图之间的状态隔离和通信机制
- LangGraph Studio 可视化调试界面的最佳实践
- 与 LangSmith 监控平台深度集成的配置细节

## 知识关联

**上游依赖**：Function Calling、Agent Loop、Swarm（更简单的起点）

**下游延伸**：AutoGen（对话式 Agent）、CrewAI（角色分工 Agent）、OpenAI Agents SDK（官方标准）、LangSmith（可观测性）
