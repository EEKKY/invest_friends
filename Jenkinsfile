pipeline {
    agent any
    tools {
        nodejs "nodejs-24"
    }
    stages {
        stage('Install pnpm') {
            steps {
                sh 'npm install -g pnpm'
            }
        }
        stage('Clone') {
            steps {
                checkout scm
            }
        }
        stage('Install & Build - Backend (NestJS)') {
            steps {
                dir('backend') {
                    sh 'pnpm install --frozen-lockfile'
                    sh 'pnpm build'
                    sh 'pnpm lint'   // 필요하면 테스트도
                    sh 'pnpm start:dev'
                }
            }
        }
        stage('Install & Build - Frontend (Next.js)') {
            steps {
                dir('next') {
                    sh 'pnpm install --frozen-lockfile'
                    sh 'pnpm build'
                    sh 'pnpm lint'   // 필요하면 린트도
                    sh 'pnpm dev'
                }
            }
        }
        // stage('Docker Build & Deploy') {
        //     steps {
        //         // 예: docker-compose up --build -d
        //     }
        // }
    }
    post {
        always {
            cleanWs()
        }
    }
}