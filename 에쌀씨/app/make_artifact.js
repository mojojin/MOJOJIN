const fs = require('fs');
const sql = fs.readFileSync('insert_marathons.sql', 'utf8');

const artifactPath = '/Users/mojojin/.gemini/antigravity/brain/d096f042-e816-4198-8975-886de272315f/marathon_migration.md';
const content = `---
type: artifact
summary: 마라톤 전체 데이터 마이그레이션 SQL
user_facing: true
request_feedback: false
---

# 🏃 명예의 전당 일괄 반영 스크립트

아래 복사 버튼을 눌러 전체 복사한 후, **Supabase SQL Editor**에 붙여넣고 실행해주세요!

\`\`\`sql
${sql}
\`\`\`
`;

fs.writeFileSync(artifactPath, content);
console.log('Artifact created successfully!');
