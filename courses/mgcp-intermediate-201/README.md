# MGCP Intermediate: openGauss 中级认证培训

## 课程概述

基于 openGauss 的 MogDB 中级认证课程，针对企业中级 DBA、架构设计师和优化者。使用金融银行高可用场景模拟业务，帮助学员深入掌握架构分析、维护优化、安全管理和高可用等技能。结合理论讲解、实践任务和企业案例剖析，实现从理论到生产的闭环。课程包含6门独立课程，可按需学习或完成全部课程获得认证。

## 课程结构

```
courses/mgcp-intermediate-201/
├── course-content.json          # 课程包目录配置文件
├── courses/                    # 独立课程目录
│   ├── mgcp-ecosystem-architecture/    # MogDB 生态发展与架构深入分析（独立课程）
│   ├── mgcp-maintenance-data/          # 深入维护与数据管理（独立课程）
│   ├── mgcp-features-security/          # 功能特性与安全管理（独立课程）
│   ├── mgcp-performance-sql/            # 性能优化与高级 SQL（独立课程）
│   ├── mgcp-backup-ha/                 # 备份恢复与高可用技术（独立课程）
│   ├── mgcp-management-tools/           # 相关管理工具与生产案例剖析（独立课程）
│   └── course-list.json             # 课程列表（6门独立课程）
├── exams/                     # 考试评估框架
│   └── exam-questions.json  # 题库和评分标准
├── assets/                    # 课程资源
│   ├── logo.png
│   ├── poster.png
│   └── cover.png
├── frontend-specs/            # 前端规范
│   ├── mixed-exam-system.md
│   ├── progress-tracking.md
│   ├── checklist-verification.md
│   └── interactive-command-syntax.md
├── DOCUMENTATION.md           # 文档说明
├── IMPLEMENTATION_SUMMARY.md # 实现总结
└── TESTING.md                 # 测试说明
```

## 课程模块

### 1. MogDB 生态发展与架构深入分析 (25 min) - `mgcp-ecosystem-architecture`
- MogDB 生态概览与定位
- openGauss 架构细节深度解析
- 金融场景架构设计决策
- 生态工具链介绍

### 2. 深入维护与数据管理 (30 min) - `mgcp-maintenance-data`
- 运维工具深度使用
- 企业级数据导入导出
- 数据治理最佳实践
- 维护脚本自动化

### 3. 功能特性与安全管理 (30 min) - `mgcp-features-security`
- 高级功能特性探索
- 权限控制策略
- 数据加密实现
- 审计日志配置
- 安全加固方案

### 4. 性能优化与高级 SQL (35 min) - `mgcp-performance-sql`
- 慢查询深度诊断
- 高级 SQL 编写技巧
- 索引优化策略
- 参数调优方法
- 性能监控工具

### 5. 备份恢复与高可用技术 (35 min) - `mgcp-backup-ha`
- 企业级备份策略
- 高可用架构设计
- 故障场景模拟与实践
- 容灾方案设计
- RPO/RTO 保障

### 6. 相关管理工具与生产案例剖析 (25 min) - `mgcp-management-tools`
- 完整工具链介绍
- 真实企业案例复盘
- 生产问题诊断流程
- 规范化操作流程
- 最佳实践总结

## 培训模式

### 金融银行场景模拟
课程使用金融银行高可用场景模拟业务环境：
- 交易系统：高并发、强一致性要求
- 账户系统：数据安全、合规要求严格
- 支付清算系统：实时性、准确性要求

### 三阶段学习路径

1. **理论学习**: 每个课程先讲解核心概念和原理
2. **实践演练**: 在模拟金融场景中实践操作
3. **案例剖析**: 分析真实企业问题和解决方案

## 交互式命令

课程支持交互式命令执行：

- `[[command]]{{RUN}}` - 执行命令并显示结果
- `[[command]]{{PRINT}}` - 仅显示命令不执行

示例：
```markdown
查看当前数据库版本：
`[[gsql --version]]{{PRINT}}`

检查表索引使用情况：
`[[EXPLAIN ANALYZE SELECT * FROM transactions]]{{RUN}}`
```

## 考试框架

### 考试类型
- 类型: 混合（笔试 + 实操）
- 时长: 90 分钟
- 及格分: 85%

### 评分维度
- 理论掌握（40%）
- 实践能力（40%）
- 规范遵循（15%）
- 文档质量（5%）

## 学习成果

完成本课程后，学员将能够：

1. 深入理解 MogDB 架构和生态
2. 独立完成企业级维护任务
3. 设计和实施高可用架构
4. 诊断和优化性能问题
5. 建立完善的安全管理体系
6. 熟练使用管理工具链

## 前置要求

### 技能要求
- 已完成 MGCA Primary 认证或同等水平
- 熟悉 SQL 基础语法
- 了解数据库基本概念

### 经验要求
- 1-2 年数据库管理或开发经验
- 了解生产环境运维挑战

## 课程特色

1. **场景化学习**: 金融银行真实业务场景
2. **实战导向**: 强调解决实际问题能力
3. **深度剖析**: 深入技术细节和设计决策
4. **工具掌握**: 完整的生产工具链使用

## 持续学习

完成本课程后，可继续进阶学习：

- 高可用架构设计
- 数据库调优专项
- 云原生数据库运维

## 技术支持

如有问题或建议，请联系课程开发团队。

## 许可证

本课程遵循木兰宽松许可证 v2 发行。

---

**祝您学习顺利，成功通过认证！**
