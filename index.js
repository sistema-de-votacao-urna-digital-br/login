let t = null;

window.addEventListener("load", () => {
  setTimeout(() => {
    if (typeof URL_APPS_SCRIPT !== "undefined" && URL_APPS_SCRIPT && !URL_APPS_SCRIPT.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) {
      fetch(`${URL_APPS_SCRIPT}?acao=obterDadosIniciais`)
        .then(c => c.json())
        .then(c => { t = c; })
        .catch(c => console.error("Erro no pre-fetch:", c));
    }
  }, 50);
});

function f(c) {
  c.preventDefault();
  
  let inputD = document.getElementById("D");
  let inputG = document.getElementById("G");

  if (!inputD || !inputG) {
    alert("Erro: Campos de usuário ou senha não encontrados no HTML.");
    return;
  }

  let d = inputD.value.trim();
  let e = inputG.value.trim();

  if (t) {
    let usuarioPlanilha = String(t.usuario);
    let senhaPlanilha = String(t.senha);
    let digitadoD = String(d);
    let digitadoE = String(e);

    if (digitadoD === usuarioPlanilha && digitadoE === senhaPlanilha) {
      sessionStorage.setItem("autenticado", "true");
      s(t);
    } else {
      alert("Usuário ou Senha incorretos! Verifique os dados digitados.");
      if (inputG) inputG.value = "";
    }
  } else {
    if (typeof URL_APPS_SCRIPT === "undefined" || !URL_APPS_SCRIPT || URL_APPS_SCRIPT.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) {
      return void alert("Atenção: Configure a URL do Apps Script no arquivo config.js!");
    }
    fetch(`${URL_APPS_SCRIPT}?acao=obterDadosIniciais`)
      .then(c => c.json())
      .then(c => {
        t = c;
        let usuarioPlanilha = String(t.usuario);
        let senhaPlanilha = String(t.senha);
        let digitadoD = String(d);
        let digitadoE = String(e);

        if (digitadoD === usuarioPlanilha && digitadoE === senhaPlanilha) {
          sessionStorage.setItem("autenticado", "true");
          s(t);
        } else {
          alert("Usuário ou Senha incorretos!");
          if (inputG) inputG.value = "";
        }
      })
      .catch(c => {
        console.error("Erro ao conectar:", c);
        alert("Erro de conexão com o servidor.");
      });
  }
}

function s(c) {
  if (c && c.chaveExiste) {
    window.location.href = "menu.html";
  } else {
    let elB = document.getElementById("B");
    let elI = document.getElementById("I");
    if (elB) elB.classList.add("J");
    if (elI) elI.classList.remove("J");
  }
}

function l(c) {
  c.preventDefault();
  
  let inputL = document.getElementById("L");
  if (!inputL) {
    alert("Erro: Campo da Chave Mestra não encontrado no HTML.");
    return;
  }

  let d = inputL.value.trim();

  if (6 !== d.length || isNaN(d)) {
    return void alert("A Chave Mestra deve conter exatamente 6 números!");
  }

  let e = btoa(d);

  fetch(URL_APPS_SCRIPT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ acao: "salvarChave", chaveMestra: e })
  })
    .then(c => c.json())
    .then(c => {
      "sucesso" === c.status
        ? (alert("Chave Mestra cadastrada com sucesso!"), window.location.href = "menu.html")
        : alert("Erro ao salvar Chave Mestra no servidor.");
    })
    .catch(c => {
      console.error("Erro de conexão ao salvar Chave Mestra:", c);
      alert("Falha de conexão com a planilha. Verifique a URL no config.js.");
    });
}
