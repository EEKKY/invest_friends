#\!/bin/bash

# kis.service.ts - Replace any types
sed -i '' 's/map((item: any) => ({/map((item: KisChartItem) => ({/g' src/stock/chart/kis/kis.service.ts
sed -i '' '313s/map((item: any) => ({/map((item: KisTimeChartItem) => ({/' src/stock/chart/kis/kis.service.ts
sed -i '' '389s/map((item: any) => ({/map((item: KisTimeChartItem) => ({/' src/stock/chart/kis/kis.service.ts
sed -i '' '485s/map((item: any) => ({/map((item: KisIndexItem) => ({/' src/stock/chart/kis/kis.service.ts
sed -i '' 's/private generateMockIndexData(/private generateMockIndexData(/' src/stock/chart/kis/kis.service.ts

# chart.service.ts - Fix function return types and remove unused import
sed -i '' 's/private generateMockChartData(/private generateMockChartData(/' src/stock/chart/chart.service.ts
sed -i '' 's/private generateMockIntradayData(/private generateMockIntradayData(/' src/stock/chart/chart.service.ts
sed -i '' '/KisChartRequestDto,/d' src/stock/chart/chart.service.ts

# dart.service.ts - Add return types
sed -i '' 's/async onModuleInit() {/async onModuleInit(): Promise<void> {/' src/stock/chart/dart/dart.service.ts
sed -i '' 's/async fetchAndStoreCorpCode() {/async fetchAndStoreCorpCode(): Promise<void> {/' src/stock/chart/dart/dart.service.ts
sed -i '' 's/async getByCorpCode(/async getByCorpCode(/' src/stock/chart/dart/dart.service.ts
sed -i '' 's/async getFinancialStatements(/async getFinancialStatements(/' src/stock/chart/dart/dart.service.ts

# dart.controller.ts - Add return types
sed -i '' 's/refreshCorpCodes() {/refreshCorpCodes(): Promise<void> {/' src/stock/chart/dart/dart.controller.ts

# main.ts - Remove unused imports
sed -i '' '/import { Reflector } from/d' src/main.ts
sed -i '' '/import { JwtAuthGuard } from/d' src/main.ts

# chart.dto.ts - Remove unused import
sed -i '' '/IsOptional/d' src/stock/chart/dto/chart.dto.ts

chmod +x fix-lint.sh
./fix-lint.sh
rm fix-lint.sh
EOF < /dev/null