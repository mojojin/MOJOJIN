const fs = require('fs');

const files = [
  'src/app/marathons/MarathonClient.tsx',
  'src/components/marathon/MarathonPBCard.tsx',
  'src/components/marathon/MarathonPBForm.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // MarathonClient.tsx replacements
  content = content.replace(/'pbs'/g, "'records'");
  content = content.replace(/activeTab === 'pbs'/g, "activeTab === 'records'");
  content = content.replace(/>최고기록</g, ">나의 기록실<");
  content = content.replace(/setTab\('pbs'\)/g, "setTab('records')");
  
  // MarathonPBCard.tsx replacements
  content = content.replace(/마라톤 개인 최고기록/g, "마라톤 개인 기록 관리");
  
  // MarathonPBForm.tsx replacements
  content = content.replace(/마라톤 PB 등록/g, "마라톤 기록 등록");
  content = content.replace(/마라톤 개인 최고기록을/g, "마라톤 달성 기록을");
  content = content.replace(/PB 달성 대회명/g, "달성 대회명");
  content = content.replace(/'PB 등록하기'/g, "'기록 등록하기'");
  content = content.replace(/마라톤 PB 저장 실패/g, "마라톤 기록 저장 실패");
  content = content.replace(/PB 갱신 실패/g, "기록 갱신 실패");
  content = content.replace(/마라톤 PB 삭제 실패/g, "마라톤 기록 삭제 실패");
  
  fs.writeFileSync(file, content);
});
console.log("Renaming complete.");
