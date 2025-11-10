pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    environment {
        NODE_VERSION = '18'
        GITHUB_REPO = 'dhr2333/Beancount-Trans'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Node 环境信息') {
            steps {
                sh '''
                    node --version || true
                    npm --version || true
                '''
            }
        }

        stage('安装依赖') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Semantic Release') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: '1b709f07-d907-4000-8a8a-2adafa6fc658', variable: 'GITHUB_TOKEN')
                ]) {
                    sh '''
                        git config user.name "Beancount-Trans CI"
                        git config user.email "ci@beancount-trans.local"
                        git remote set-url origin https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git
                        npx semantic-release
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ Semantic Release 执行成功'
        }
        failure {
            echo '❌ Semantic Release 执行失败，请检查日志'
        }
        always {
            cleanWs()
        }
    }
}

