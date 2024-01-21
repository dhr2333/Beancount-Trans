# Beancount-Trans
经过长期对Beancount的使用和测试，我发现在日常记账中最烦恼的有以下几点：

1. 由于记录数量太多，若每个记录都以单独条目记录则需要耗费大量时间，若以天为条目进行记账，又会导致条目的颗粒度太大；
2. 我是以周为频率进行记账断言的，对于长期记账来说这个频率未免太频繁；
3. 支出账户没有形成系统的规划，导致记录条目时总是要纠结选用哪个支出账户，且记录后也无法通过FAVA的试算表了解自己的各类支出情况；

针对以上记账痛点，开发出Beancount-Trans用于**账单的自动解析**。

**上传账单，系统会根据定义好的商户和账户自动格式化输出为beancount能识别的文本**。当前已支持自动更新至Beancount-Trans-Assets项目，仅支持本地部署用户启用。

例如"食物"会归类于Expense:Food账户，匹配到"晚餐"会归类与Expense:Food:Dinner账户，默认会归类于Expense:Other，默认情况可能需要手动进行归类。为了尽可能减少Expense:Other的出现，用户需要维护好自己的支出映射，这样能让自己的记账效率和准确性大大提升。

> 项目链接：https://trans.dhr2333.cn/ 

无登录解析时会使用通用映射模板。

本项目提供测试账单，参考[此文章](https://blog.triplez.cn/posts/bills-export-methods/#%e6%94%af%e4%bb%98%e5%ae%9d)获取支付宝账单；参考[此文章](https://blog.triplez.cn/posts/bills-export-methods/#%e5%be%ae%e4%bf%a1%e6%94%af%e4%bb%98)获取微信账单；

获取招商银行信用卡账单，通过"掌上生活"APP->查账->账单补寄(补寄方式为「电邮发送」)->申请补寄。

![Beancount-Trans 首页](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202310101642806.png)

## 使用步骤

1. 从支付宝、微信、招商银行信用卡中获取账单
2. 在https://trans.dhr2333.cn/trans 首页中上传csv或pdf文件完成解析
3. 复制解析后的文本至 *自己账本* 或Beancount-Trans-Assets项目（提供基础的目录结构）对应的年月目录中
4. 修改文本中的Expense:Other和Assets:Other的条目（未解析成功）
5. 在Beancount-Trans-Assets项目中使用`fava main.bean`运行程序，通过http://127.0.0.1:5000 访问
6. 根据fava提示修改错误条目

![Fava 日记账](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202310101706811.png)

![Fava 试算表](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202310101710353.png)

## 使用说明

该项目默认读者有beancount的使用经验。在使用Beancount-Trans过程中，有以下几点需要注意

### 默认忽略

默认会对余额宝账户的收益进行忽略，推荐在下个月balance时以"Income:Investment:Interest"利息计入。

默认会对微信支付状态为"已全额退款"、 "对方已退还"或以"已退款"开头的条目进行忽略。

默认会对支付宝支付状态为"退款成功"、"交易关闭"、"解冻成功"、"信用服务使用成功"、"已关闭"的条目进行忽略。

默认会对招商银行信用卡账单中通过"支付宝"、"微信"支付的条目进行忽略。

### 手动处理

最终解析结果为"Expenses:Other"、"Income:Other"、"Assets:Other"时，说明无法正确解析，请手动处理或增加映射后再次解析。

当某个银行含有多张储蓄卡时，可能导致无法解析需手动处理。

### 三餐判断

服务对三餐的判断有两种形式，一种是根据Expense中的支出映射来决定最终的条目，例如账单中含有"早餐"的备注会被匹配到"Expenses:Food:Breakfast"。

还有一种是后端的硬编码，系统在根据支出映射解析完成后得到的条目为"Expenses:Food"时，会根据账单时间对条目进行调整，例如发生在06:00到10:00之间的"Expenses:Food"条目，系统会自动修改为"Expenses:Food:BreakFast"。

	早餐时间：06:00~10:00
	午餐时间：10:00~14:00
	晚餐时间：16:00~20:00

当支出映射与三餐时间冲突时，例如在`2023-11-26 10:49:54,扫二维码付款,瑞安市暖爸副食品店,"收款方备注:二维码收款付款方留言:饮料",支出,¥3.00,零钱通,已转账,100004990123112600060327753584678844	,10000499012023112601373972597516	,"/"`条目中

包含"饮料"和"食品"两个关键字，其中"饮料"的Expense为"Expenses:Food:DrinkFruit"，"食品"的Expense为"Expenses:Food"。虽然根据三餐判断时间为早餐"Expenses:Food:Breakfast"与"Expenses:Food:DrinkFruit"优先级一致，但实际情况归类于早餐并不合适。

所以关键字与三餐的判断规则为：先判断关键字优先级，再判断三餐时间。

### 解析优先级

通过关键字对商家和说明进行匹配难免出现重复，例如"华为"、"华为终端"和"华为软件"时应分别对应"Expenses:Shopping"、"Expenses:Shopping:Digital"和"Expenses:Culture"，所以无法单纯的使用"华为"关键字作为Expenses的判断依据。

很明显，"华为软件"及"华为终端"的优先级应大于"华为"，但他们最终又同属于"华为"商家。所以解析优先级在经过试错后最终定为：

1. 计算Expenses中":"的数量，每存在一个，则按":"的数量*100
2. 若"商家"不为空，则优先级+50

 最终对应"华为"的优先级为100,"华为终端"的优先级为250,"华为软件"的优先级为150，用户需要根据优先级计算规则定义合适的"映射账户"和"商家"。

## 快速开始（本地容器环境部署）

为了方便用户使用，作者提供本地docker compose的部署方式。**推荐以该方式部署，集成了Fava展示、自动记录等多项自动化功能**。

若无Docker环境，可参考[本地环境部署](#Beancount-Trans-Backend)文档。

### 项目初始化

```shell
git clone https://github.com/dhr2333/Beancount-Trans.git
cd Beancount-Trans; git submodule update --init  # 初始化所有子模块
# git submodule foreach git switch main  # 所有子模块切换到main分支
# git submodule foreach git pull origin main  # 若有需要则将所有子模块拉取main分支代码
```

### 首次运行

首次运行会自动创建名为'mysql-data'和'redis-data'的存储卷并打包生成镜像部署。

在Benacount-Trans主目录下启动

```
$ docker compose build  # 编译
$ docker compose up -d  # 运行
```

### 访问

通过http://127.0.0.1:38001/trans 进行解析，同时可以通过"我的账本"直接访问完整账本信息。

![Pasted image 20231210165239](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202312101703363.png)

### 持久化存储

mysql默认使用初始化数据，并不做持久化存储。若需要持久化存储需要放开以下注释：

```
beancount-trans-mysql:
	volumes:
      - mysql:/var/lib/mysql  # 若需要持久存储取消该注释和volumes中的注释
volumes:
  mysql:
    external: true  # 若已创建外部存储卷，则取消该注释(多次docker compose up可能会导致存储卷重复创建导致启动失败)
    name: mysql-data
  redis:
    external: true  # 若已创建外部存储卷，则取消该注释
    name: redis-data
```

# Beancount-Trans-Assets

Beancount-Trans-Assets项目提供 **Beancount账本组织结构**，所有记账条目以月进行统计，以年进行存档。
账本结构说明可参考 [Beancount_05_项目管理](https://www.dhr2333.cn/article/2022/9/10/55.html)。

Github私有项目创建成功后，可将代码上传至私有仓库

```shell
git clone https://github.com/dhr2333/Beancount-Trans-Assets.git
cd Beancount-Trans-Assets
# 修改后
git add .
git commit -m "提交记录"
git remote add origin [你的项目链接]
git branch -M main
git push -u origin main
```

# Beancount-Trans-Backend

Beancount-Trans项目集中的后端项目，主要实现账单格式的转换功能及提供对外接口。

## 安装

```shell
$ cd Beancount-Trans-Backend
$ pipenv install  #  安装虚拟环境
$ pipenv shell  # 使用虚拟环境
$ pip install -r requirements.txt  # 安装所需依赖
```

## 运行

修改`djangoblog/setting.py` 修改数据库配置，如下所示：

```
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('TRANS_MYSQL_DATABASE') or 'beancount-trans',
        'USER': os.environ.get('TRANS_MYSQL_USER') or 'root',
        'PASSWORD': os.environ.get('TRANS_MYSQL_PASSWORD') or 'root',
        'HOST': os.environ.get('TRANS_MYSQL_HOST') or '127.0.0.1',
        'PORT': os.environ.get('TRANS_MYSQL_PORT') or '3306',
        'TIME_ZONE': 'Asia/Shanghai',
    }
}
```

## 创建数据库

mysql数据库中执行:

```
CREATE DATABASE `beancount-trans`
```

然后终端下执行:

```
python manage.py makemigrations
python manage.py migrate
```

导入提供的SQL模板，并根据自己的实际账户进行调整：

```
mysql -h127.0.0.1 -uroot -proot  beancount-trans < 20231209-Develop.sql  # 当前模板含有强烈的个人风格，建议根据自己情况修改
```

## 开始运行

执行： `python manage.py runserver 0:8002`

浏览器打开 http://127.0.0.1:8002/translate/trans 就可以完成初步的账单解析功能默认会对余额宝账户的收益进行忽略，推荐在下个月balance时以"Income:Investment:Inte。

# Beancount-Trans-Frontend

```shell
$ npm install 
$ npm run dev  # 启动程序
```

浏览器打开 http://localhost:5173/ ，需要Beancount-Trans-Backend及数据库服务正常运行才能实现解析功能。
