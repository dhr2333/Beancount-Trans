# Beancount-Trans

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://www.docker.com/)
[![Awesome Beancount](https://awesome.re/badge.svg)](https://awesome-beancount.com/#china)

> **项目旨在探索 GTD 方法论对财务状况管理的最佳实践**。现已被 [Awesome Beancount](https://awesome-beancount.com/#china) 官方资源列表收录，成为服务中国区用户的核心工具。

## 一句话说明

上传账单，自动转换为可审计的 Beancount 复式记账数据，并在几分钟内分析财务报表。

## 30 秒判断：是否适合你

### 适合

- 你已在用 Beancount，希望规范化、减轻逐笔决策，并在同一条目中尽可能保留更多信息。
- 你已有支付宝、微信或银行账单，想快速进入 Beancount。
- 你希望使用云平台，或自行部署到私有环境。

### 可能不适合

- 你要求完全零配置且无需任何人工校对。
- 你只需要简单移动端记账 App，而不关心复式记账与可审计性。

## 平台演示

解析页不保留上传文件；分类在本地完成，不经大模型，无需担心账单隐私。

![云平台用户演示视频](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202508191544942.gif)

![解析审核](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202607011123512.gif)

## 快速开始

### 云平台用户

1. 访问 [Beancount-Trans 平台](https://trans.dhr2333.cn/) 注册并登录。
2. 上传账单进行解析。
3. 查看并分析财务报表。

快速入门教程：[快速入门 | Beancount-Trans](https://trans.dhr2333.cn/docs/%E6%95%99%E7%A8%8B/quick-start)

### 自托管用户

项目拉取并运行：

```shell
git clone https://github.com/dhr2333/Beancount-Trans.git
cd Beancount-Trans
git submodule update --init Beancount-Trans-Backend
git clone https://huggingface.co/google-bert/bert-base-chinese ./Beancount-Trans-Backend/pretrained_models/bert-base-chinese
cp .env.example .env
docker compose up -d
```

通过 <http://localhost:38001/> 进行平台访问

> 默认用户 `admin` 默认密码 `123456`

详情查看 [自托管](https://trans.dhr2333.cn/docs/developer/self-host) 操作指南

## 问题反馈与支持

- 报告问题（注意如果要上传账单请抹除隐私信息）：[GitHub Issues](https://github.com/dhr2333/Beancount-Trans/issues)
- 讨论：[GitHub Discussions](https://github.com/dhr2333/Beancount-Trans/discussions)
