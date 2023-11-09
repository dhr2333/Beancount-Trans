# Beancount-Trans 
经过长期对Beancount的使用和测试，我发现在日常记账中最烦恼的有以下几点：

1. 由于记录数量太多，若每个记录都以单独条目记录则需要耗费大量时间，若以天为条目进行记账，又会导致条目的颗粒度太大；
2. 我是以周为频率进行记账断言的，对于长期记账来说这个频率未免太频繁；
3. 支出账户没有形成系统的规划，导致记录条目时总是要纠结选用哪个支出账户，且记录后也无法通过FAVA的试算表了解自己的各类支出情况；

针对以上记账痛点，开发出Beancount-Trans用于账单的自动解析。

**上传账单，系统会根据定义好的商户和账户自动格式化输出为beancount能识别的文本**。当前已支持自动更新至Beancount-Trans-Assets项目，暂未向互联网用户开放。

例如"食物"会归类于Expense:Food账户，匹配到"晚餐"会归类与Expense:Food:Dinner账户，默认会归类于Expense:Other，默认情况可能需要手动进行归类。为了尽可能减少Expense:Other的出现，用户需要维护好自己的支出映射，这样能让自己的记账效率和准确性大大提升。

> 项目链接：https://trans.dhr2333.cn/ 

无登录解析会使用通用映射模板。测试账单可通过https://github.com/dhr2333/Beancount-Trans获取，微信账单及支付宝账单需自行百度获取。

![Beancount-Trans 首页](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202310101642806.png)

## 使用步骤

1. 从支付宝、微信中获取账单；
2. 在https://trans.dhr2333.cn/trans 首页中上传文件完成解析；
3. 复制解析后的文本至 *自己账本* 或Beancount-Trans-Assets项目（提供基础的目录结构）对应的年月目录中；
4. 修改文本中的Expense:Other和Assets:Other的条目（未解析成功）
5. 在Beancount-Trans-Assets项目中使用`fava main.bean`运行程序，通过http://127.0.0.1:5000访问；
6. 根据fava提示修改错误条目；

![Fava 日记账](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202310101706811.png)

![Fava 试算表](https://daihaorui.oss-cn-hangzhou.aliyuncs.com/djangoblog/202310101710353.png)

## 使用说明

该项目默认读者有beancount的使用经验。在使用Beancount-Trans过程中，有以下几点需要注意

### 解析优先级

通过关键字对商家和说明进行匹配难免出现重复，例如"华为"、"华为终端"和"华为软件"时应分别对应"Expenses:Shopping"、"Expenses:Shopping:Digital"和"Expenses:Culture"，所以无法单纯的使用"华为"关键字作为Expenses的判断依据。

很明显，"华为软件"及"华为终端"的优先级应大于"华为"，但他们最终又同属于"华为"商家。所以解析优先级在经过试错后最终定为：

1. 计算Expenses中":"的数量，每存在一个，则按":"的数量*100
2. 若"商家"不为空，则优先级+50

 最终对应"华为"的优先级为100,"华为终端"的优先级为250,"华为软件"的优先级为150，用户需要根据优先级计算规则定义合适的"映射账户"和"商家"。

## 项目开发

可以使用Beancount-Trans目录作为项目的根目录

```
[daihaorui@localhost Beancount-Trans]$ tree -L 1
.
├── Beancount-Trans-Assets  # https://github.com/dhr2333/Beancount-Trans-Assets.git
├── Beancount-Trans-Backend  # https://github.com/dhr2333/Beancount-Trans-Backend.git
└── Beancount-Trans-Frontend  # https://github.com/dhr2333/Beancount-Trans-Frontend.git
```

# Beancount-Trans-Assets

项目拉取

```
git clone https://github.com/dhr2333/Beancount-Trans-Assets.git
cd Beancount-Trans-Assets
# 修改后
git add .
git commit -m "提交记录"
```

Github私有项目创建成功后，可查看项目首页，将代码上传至私有仓库

```
git remote add origin [你的项目链接]
git branch -M main
git push -u origin main
```

# Beancount-Trans-Backend

Beancount-Trans项目集中的后端项目，主要实现账单格式的转换功能及提供对外接口。

## 安装

```shell
$ pip install pipenv  #  使用虚拟环境
$ pipenv shell
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
mysql -h127.0.0.1 -uroot -proot  beancount-trans < translate_assets_map.sql  # 资产账户，模板只提供微信支付宝的账单解析，银行卡及信用卡需手动添加
mysql -h127.0.0.1 -uroot -proot  beancount-trans < translate_expense_map.sql  # 支出账户，当前模板含有强烈的个人风格，建议根据自己情况修改
```

## 开始运行

执行： `python manage.py runserver`

浏览器打开 http://127.0.0.1:8000/translate/trans 就可以完成初步的账单转换功能。

# Beancount-Trans-Frontend

```shell
$ npm install 
$ npm run dev  # 启动程序
```

# 容器部署

为了方便用户使用，作者提供了docker-compose的部署方式，但镜像的生成还需用户手动打包。

## 镜像打包

对于python依赖自行处理，不提供处理方法。

```
cd Beancount-Trans-Backend && docker build -t harbor.dhr2333.cn:8080/library/beancount-trans-backend:latest .
cd Beancount-Trans-Frontend && npm run build  && docker build -t harbor.dhr2333.cn:8080/library/beancount-trans-frontend:latest .
```

## 首次运行

首次运行需要修改docker-compose中的volumes配置，会自动生成存储卷，之后数据会持久化存储。

```
volumes:
  mysql:
    external: true # 第一次启动mysql时将该行注释，用于创建存储卷
    name: mysql-data
  redis:
    external: true # 第一次启动mysql时将该行注释，用于创建存储卷
    name: redis-data
```

直接docker-composeo启动

```
$ docker-compose up -d
```

## 访问

通过http://127.0.0.1:38001/trans 进行解析，同时可以通过"我的账本"直接访问完整账本信息。
