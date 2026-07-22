const fs = require('fs');
const sql = fs.readFileSync('update_marathons.sql', 'utf8');

const artifactPath = '/Users/mojojin/.gemini/antigravity/brain/d096f042-e816-4198-8975-886de272315f/marathon_update_migration.md';
const content = `---
type: artifact
summary: 마라톤 전체 데이터 마이그레이션 (기존 데이터 보완)
user_facing: true
request_feedback: false
---

# 🏃 명예의 전당 강제 업데이트 스크립트

아까 실행하신 스크립트가 적용되지 않은 이유는, 회원님들이 이미 앱을 테스트하시면서 **풀코스 0회** 상태의 빈 PB(개인기록) 데이터를 만들어두셨기 때문이었습니다! (기존 스크립트는 중복 방지를 위해 빈 기록이라도 존재하면 건너뛰도록 되어있었습니다.)

기존의 0회 빈 기록을 **json 데이터의 완주 횟수와 대회 이름으로 덮어씌워주는 강력한 업데이트 쿼리문**을 준비했습니다. 

아래 복사 버튼을 눌러 전체 복사한 후, **Supabase SQL Editor**에 붙여넣고 실행해주세요!

\`\`\`sql
${sql}
\`\`\`
`;

fs.writeFileSync(artifactPath, content);
console.log('Update Artifact created successfully!');
