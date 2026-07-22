const fs = require('fs');

const sql = `-- 관리자가 goods_requests를 삭제할 수 있도록 권한 부여
CREATE POLICY "Admins can delete goods_requests" ON public.goods_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
  )
);
`;

const artifactPath = '/Users/mojojin/.gemini/antigravity/brain/d096f042-e816-4198-8975-886de272315f/add_delete_policy.md';
const content = `---
type: artifact
summary: 굿즈 내역 삭제 권한 추가 SQL
user_facing: true
request_feedback: false
---

# 🗑️ 굿즈 삭제 권한 추가

관리자님! 삭제를 눌러도 내역이 사라지지 않았던 이유는, **"신청 내역 데이터를 안전하게 보호하기 위해 DB(데이터베이스) 단에서 삭제 권한이 막혀 있었기 때문"**입니다! (권한이 없어서 삭제 명령을 내려도 조용히 무시되고 있었어요 😭)

아래 쿼리문을 복사하셔서 **Supabase SQL Editor**에서 한 번만 실행(RUN)해주시면, 관리자님께 완벽한 삭제 권한이 부여됩니다!

\`\`\`sql
${sql}
\`\`\`

실행하신 후 다시 웹페이지에서 [삭제] 버튼을 눌러보시면, 재고도 자동으로 복구되면서 신청 내역이 깔끔하게 삭제될 것입니다!
`;

fs.writeFileSync(artifactPath, content);
console.log('Artifact created!');
