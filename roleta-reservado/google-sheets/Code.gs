/**
 * Reservado — cadastro da Roleta Premiada
 *
 * Apps Script vinculado à conta do organizador.
 * Publicação: Implantar > Nova implantação > App da Web
 * Executar como: Eu | Quem tem acesso: Qualquer pessoa.
 *
 * OBS: permite envio público de dados. A planilha permanece privada
 * (não habilitar compartilhamento público), mas o endpoint necessita
 * proteção adicional contra abuso para eventos de grande escala.
 */
var PROP_ID = 'RESERVADO_SPREADSHEET_ID';

function planilha_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_ID);
  var book;
  if (id) {
    book = SpreadsheetApp.openById(id);
  } else {
    book = SpreadsheetApp.create('Reservado - Cadastros Roleta');
    props.setProperty(PROP_ID, book.getId());
  }
  var sheet = book.getSheetByName('Participantes');
  if (!sheet) {
    sheet = book.insertSheet('Participantes');
    sheet.appendRow(['Data e hora', 'Senha', 'Nome completo', 'Telefone', 'Cidade', 'Status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function safeCell_(s) {
  s = String(s || '').trim();
  return /^[=+@\-]/.test(s) ? "'" + s : s;
}
function pagina_(mensagem, detalhe) {
  var content = '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>' +
  '<body style="background:#f5ecfb;font-family:Arial;text-align:center;padding:32px;color:#3b145f">' +
  '<div style="max-width:420px;margin:40px auto;background:white;border-radius:22px;padding:30px;box-shadow:0 10px 30px #32105b22">' +
  '<h1 style="color:#56228b">RESERVADO</h1><h2>' + mensagem + '</h2><p>' + detalhe + '</p></div></body></html>';
  return HtmlService.createHtmlOutput(content).setTitle('Reservado - Cadastro');
}
function doGet(e) {
  return pagina_('Cadastro Reservado', 'Acesse o QR Code oficial para preencher o formulário.');
}
function doPost(e) {
  try {
    var params = e.parameter || {};
    var nome = String(params.nome || '').trim().slice(0, 100);
    var telefone = String(params.telefone || '').replace(/\D/g, '').slice(0, 15);
    var cidade = String(params.cidade || '').trim().slice(0, 80);
    var honeypot = String(params.website || '');
    if (honeypot) return pagina_('Cadastro recebido', 'Verifique sua participação com a equipe.');
    if (nome.length < 3 || telefone.length < 10 || cidade.length < 2) {
      return pagina_('Verifique seus dados', 'Volte ao formulário e confira nome, telefone e cidade.');
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      var sheet = planilha_();
      var last = sheet.getLastRow();
      var senha = 'R-' + ('00000' + Math.max(last, 1)).slice(-5);
      sheet.appendRow([new Date(), senha, safeCell_(nome), "'" + telefone, safeCell_(cidade), 'Aguardando']);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    return pagina_('Cadastro confirmado!', 'Sua senha: <strong style="font-size:30px">' + senha + '</strong><br>Apresente esta tela à equipe.');
  } catch (err) {
    console.error(err);
    return pagina_('Não foi possível confirmar', 'Tente novamente ou procure a equipe. O cadastro pode não ter sido salvo.');
  }
}
