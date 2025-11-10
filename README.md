# Beancount-Trans

[![README in English](https://img.shields.io/badge/English-DFE0E5)](README.md)
[![简体中文版自述文件](https://img.shields.io/badge/简体中文-DBEDFA)](README_zh.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://www.docker.com/)

## 🌟 Project Overview

Beancount-Trans is a (self-hosted) intelligent bill conversion platform that helps users easily convert daily transaction statements (such as Alipay, WeChat Pay, bank statements, etc.) into a professional bookkeeping format (Beancount) and provides comprehensive financial reporting services.

### 🌍 Vision

To enable ordinary users without accounting knowledge to easily use professional-grade double-entry bookkeeping tools, achieving transparent financial management.

### ✨ Core Value

* **Zero Learning Curve**: No accounting knowledge or technical background required.
* **One-Click Reports**: Get complete financial reports just by uploading your statements.
* **Smart Categorization**: AI-powered transaction category recognition.
* **Privacy First**: Complete user data isolation ensures privacy.

### 🚀 Core Features

* 🔐 **Self-Hosting Support**: Fully open-source, supports private deployment.
* 🧠 **AI-Powered Parsing**: Uses AI technologies like DeepSeek to automatically identify transaction categories.
* 🔒 **Containerized Isolation**: Each user has an independent financial environment.
* 📱 **Access Anywhere**: View your financial data anytime, anywhere.
* 📁 **Statement File Management**: Supports common statement formats like CSV, PDF, Excel.
* 📊 **Financial Reporting Services**: Automatically generates professional financial reports.
* ⚡ **Asynchronous Processing**: Optional batch processing after upload for fast report generation.

## 🛠️ Technical Architecture

```mermaid
graph TD
    A[Web Frontend] -->|API Requests| B(Traefik Gateway)
    B -->|JWT Auth| C[Django REST API]
    C --> D[Statement Parser Engine]
    D --> E[AI Classification Model]
    E -->|BERT/spaCy/DeepSeek| F[Account Mapping Service]
    C --> G[Celery Task Queue]
    G --> H[Parsing Worker]
    H --> I[MinIO/S3]
    H --> J[File System]
    J --> K[Fava Container]
    C --> L[PostgreSQL]
    C --> M[Redis]
    K -->|Traefik Routing| N[User Access]
```

### Cloud Platform Parsing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant PostgreSQL
    participant Celery
    participant Worker
    participant Redis
    participant MinIO
    participant FavaContainer
    participant FileSystem
    participant Scheduler

    User->>Frontend: 1. Upload Statement File
    Frontend->>Backend: Send File
    Backend->>MinIO: Store Raw File
    Backend->>FileSystem: Create Empty .bean File
    Backend->>PostgreSQL: Record Upload Info

    User->>Frontend: 2. Submit Batch Parse Request
    Frontend->>Backend: Submit Parse Request
    Backend->>Celery: Create Task
    Celery->>Worker: Start Job
    Worker->>MinIO: Get File
    Worker->>Worker: Parse Statement Content
    Worker->>PostgreSQL: Get Mapping Rules
    alt Keyword Conflict
        Worker->>Worker: Call AI for Judgment
    end
    Worker->>FileSystem: Store Parse Result (.bean)
    Backend-->>Frontend: Return Task ID

    loop Status Polling
        User->>Frontend: Check Progress
        Frontend->>Backend: Query Task Status
        Backend-->>Frontend: Return Progress
    end

    User->>Frontend: 3. Access "Platform Ledger"
    Frontend->>Backend: GET /api/fava
    alt Container Exists
        Backend->>Backend: Reset Expiry Timer
    else
        Backend->>FavaContainer: Create Container
    end
    Backend-->>Frontend: Return Ledger URL
    Frontend->>FavaContainer: Redirect
    FavaContainer-->>User: Display Reports

    rect rgba(0, 255, 0, 0.1)
        Scheduler->>Backend: Trigger Every Minute
        Backend->>FavaContainer: Check Last Access Time
        alt Timeout (>1 hour)
            Backend->>FavaContainer: Destroy Container
        end
    end
```

## 🎥 Platform Demo

![Cloud Platform User Demo Video](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202508191544942.gif)

## 🚀 Quick Start

### 👤 Cloud Platform Users

Just 3 steps from statement upload to professional financial reports:

#### Step 1: Register & Login

1. Visit the [Beancount-Trans Platform](https://trans.dhr2333.cn/)
2. Create a new account or use a third-party login.

#### Step 2: Upload & Parse Statements

1. Click "Upload Statement" on the File Management page.
2. Select your Alipay, WeChat, or bank statement file.
3. Select the statements for batch parsing and conversion to the professional format.

Example Output (`beancount` format):

```beancount
2018-01-19 * "Ctrip" "Danqing Lily Business Hotel (Changzhou Jinghu High-speed Rail North Station Branch)"
    time: "14:41:51"
    uuid: "2018011921001004560568228384"
    status: "ALiPay - Transaction Successful"
    Expenses:Culture 128.00 CNY
    Liabilities:CreditCard:Web:AliPay -128.00 CNY
```

#### Step 3: Access Financial Reports

1. Click "Platform Ledger" in the navigation bar under "Ledger Management".
2. The system will automatically create your dedicated financial container.
3. View professional financial reports including:
    * 💰 Income Statement (Income vs. Expenses)
    * 🏦 Balance Sheet (Assets vs. Liabilities)
    * 📈 Spending Category Statistics
    * 📆 Monthly Financial Trends

### 🖥 Self-Hosted Deployment Guide

#### Project Initialization

```shell
git clone https://github.com/dhr2333/Beancount-Trans.git
cd Beancount-Trans
git submodule update --init  # Initialize all submodules
```

#### First Run

The first run will automatically create storage volumes named `postgres-data` and `redis-data`.

All container ports can be specified as needed.

Run the following command in the main Beancount-Trans directory:

```shell
docker compose up  # Add the -d flag to run in detached mode
```

Alternatively, build and then run:

```shell
# If using build configuration in compose file (example snippet shown)
$ docker compose build  # Build images
$ docker compose up    # Start containers
```

![docker compose build start_1](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202403120934590.png)
![docker compose build start_2](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202403120934209.png)

#### Access

Access the parser via <http://localhost:38001/trans> and copy the results into your local ledger.

![Beancount-Trans Parser Homepage](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202508191716372.png)

## 📚 Documentation & Resources

* [Cloud Platform User Guide](/docs/parsing_spec.md)
* [Beancount Getting Started](https://www.dhr2333.cn/article/2022/9/10/51.html) (Chinese)
* [Deployment Guide](/docs/deployment.md)

## 🚀 Semantic Release

This repository adopts [semantic-release](https://semantic-release.gitbook.io/semantic-release/) for automated versioning and changelog generation.

1. Follow the [Conventional Commits](https://www.conventionalcommits.org/) convention when writing commit messages (e.g. `feat: ...`, `fix: ...`).
2. Merges into the `main` branch trigger the Jenkins pipeline located at the repository root. The pipeline runs `npx semantic-release`, bumping versions across sub-projects, generating `CHANGELOG.md`, and publishing a GitHub Release.
3. Each release automatically synchronizes the new version into:
   * `Beancount-Trans/package.json`
   * `Beancount-Trans-Frontend/package.json`
   * `Beancount-Trans-Docs/package.json`
   * `Beancount-Trans-Docs/docs/07-版本更新日志/v<version>.md` (auto-created when absent)
4. After the pipeline finishes, maintainers only need to edit the generated changelog entries and documentation templates as necessary.
* [API Documentation](https://trans.dhr2333.cn/api/redoc/)
* [Knowledge Base / Wiki](https://www.dhr2333.cn/category/beancountfu-shi-ji-zhang.html) (Chinese)

## 👥 Community & Support

* 🐛 [Report Issues](https://github.com/dhr2333/Beancount-Trans/issues)
* 💬 [Discussions](https://github.com/dhr2333/Beancount-Trans/discussions)
* 📧 [Support Email](mailto:dai_haorui@163.com)

## ❤️ Support Us

Donations will be used entirely to improve the parsing speed of the [website](https://trans.dhr2333.cn/).

WeChat Pay supports label parsing, add suffix `#TEST` in the notes if needed.
Alipay supports credit card and Huabei payments.

<div>
<img src="https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202403311658448.png"
 width="150" height="150" alt="WeChat Pay QR Code" />
<img src="https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202405301410904.png"
 width="150" height="150" alt="Alipay QR Code" />
</div>
