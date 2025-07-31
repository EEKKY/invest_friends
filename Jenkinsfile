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
                    sh 'pnpm lint'
                    sh 'pnpm build'
                    sh 'pnpm start'
                }
            }
        }
        stage('Install & Build - Frontend (Next.js)') {
            steps {
                dir('frontend') {
                    sh 'pnpm install --frozen-lockfile'
                    sh 'pnpm lint'
                    sh 'pnpm build'
                    sh 'pnpm preview'
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