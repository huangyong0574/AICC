# 算法概念知识图谱 E2E 测试报告

- **测试时间**: 2026-05-08T10:36:40.464Z
- **耗时**: 45.5s
- **测试 URL**: http://localhost:5180
- **测试概念**: Flash Attention, Mamba, DPO

## 测试结果

| Phase | 概念 | 状态 | 说明 |
|-------|------|------|------|
| 0 | - | PASS | 示例区域正常，共 7 个概念按钮 |
| 1 | Flash Attention | PASS | 输入:true 按钮可用:true 预热:true |
| 2 | Mamba | PASS | 输入:true 按钮可用:true 预热:true |
| 3 | DPO | PASS | 输入:true 按钮可用:true 预热:true |
| 4 | - | WARN | 页面展示 10 个示例（预期 5 个随机抽取） |

## 统计

- 总计: 5
- 通过: 4
- 警告: 1
- 失败: 0

## 截图清单

- `00-examples-area.png`
- `01-concept-FlashAttention.png`
- `02-concept-Mamba.png`
- `03-concept-DPO.png`
- `01-concept-FlashAttention-warmup.png`
- `02-concept-Mamba-warmup.png`
- `03-concept-DPO-warmup.png`

## 结论

⚠️ 通过（有警告）
