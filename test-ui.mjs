import fs from 'fs';
let file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

// The river form button is:
const rgBtn = /<button[\s\S]*?onClick=\{\(\) => \{\n\s*setRiverForm\([\s\S]*?\} >\n\s*Tambah Sensor Sungai\n\s*<\/button>/g;
txt = txt.replace(rgBtn, '');

const rgRiverSection = /\{\/\* River Sensors Section \*\/\}[\s\S]*?(?=\{\/\* Weather Upstream Section \*\/\}|<div className="space-y-6">)/;
txt = txt.replace(rgRiverSection, '');

const rgRiverModal = /<Modal[\s\S]*?isOpen=\{showFloodModal\}[\s\S]*?<\/form>\n\s*<\/Modal>/g;
txt = txt.replace(rgRiverModal, '');

// For logs tab: we just remove the tab from sidebar array and its content if we want. Wait, did they mean the whole tab? "audit_logs" 
// Yes, whole logs UI. But is it just a tab?
// 'logs' tab doesn't exist in the sidebarGroups! Wait... Let's see if 3540 has the logs tab.
fs.writeFileSync(file, txt);
