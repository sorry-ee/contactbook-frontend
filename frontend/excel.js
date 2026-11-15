/* SheetJS is hosted locally so the application does not depend on a public CDN. */
window.ContactExcel = {
  headers: ['姓名','收藏','手机号','邮箱','社交账号','通讯地址','备注'],
  fields: ['phones','emails','socials','addresses'],
  read(buffer) {
    let workbook;
    try { workbook = XLSX.read(buffer, {type:'array', sheetRows:1002}); }
    catch { throw new Error('文件不是有效的 Excel 工作簿'); }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error('工作簿没有工作表');
    const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:'', raw:true, blankrows:false});
    if (JSON.stringify(rows.shift()) !== JSON.stringify(this.headers)) throw new Error('表头不符合模板，请先下载模板');
    if (rows.length > 1000) throw new Error('每次最多导入1000行');
    return rows.map((row,index) => {
      if (row.length !== 7 || row.some(v => typeof v !== 'string')) throw new Error(`第${index+2}行请按模板填写，所有列使用文本格式`);
      if (!['是','否'].includes(row[1])) throw new Error(`第${index+2}行收藏必须填“是”或“否”`);
      const c = {name:row[0],favorite:row[1]==='是',notes:row[6]};
      this.fields.forEach((field,i) => c[field] = row[i+2].split(/\r?\n/));
      return c;
    });
  },
  write(contacts) {
    const rows = [this.headers, ...contacts.map(c => [c.name,c.favorite?'是':'否',...this.fields.map(k=>c[k].join('\n')),c.notes])];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = this.headers.map(() => ({wch:26}));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,sheet,'通讯录');
    return XLSX.write(workbook,{type:'array',bookType:'xlsx'});
  }
};
