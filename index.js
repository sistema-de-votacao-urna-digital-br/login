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
  let d = document.getElementById("d").value.trim();
  let e = document.getElementById("g").value.trim();

  if (t && d === t.usuario && e === t.senha) {
    sessionStorage.setItem("autenticado", "true");
    s(t);
  } else if (!t) {
    if (typeof URL_APPS_SCRIPT === "undefined" || !URL_APPS_SCRIPT || URL_APPS_SCRIPT.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) {
      return void alert("Atenção: Configure a URL do Apps Script no arquivo config.js!");
    }
    fetch(`${URL_APPS_SCRIPT}?acao=obterDadosIniciais`)
      .then(c => c.json())
      .then(c => {
        t = c;
        if (d === t.usuario && e === t.senha) {
          sessionStorage.setItem("autenticado", "true");
          s(t);
        } else {
          alert("Usuário ou Senha incorretos!");
          document.getElementById("g").value = "";
        }
      })
      .catch(c => {
        console.error("Erro ao conectar:", c);
        alert("Erro de conexão com o servidor.");
      });
  } else {
    alert("Usuário ou Senha incorretos! Verifique os dados digitados.");
    document.getElementById("g").value = "";
  }
}

function s(c) {
  if (c && c.chaveExiste) {
    window.location.href = "menu.html";
  } else {
    document.getElementById("b").classList.add("j");
    document.getElementById("i").classList.remove("j");
  }
}

function l(c) {
  c.preventDefault();
  let d = document.getElementById("m").value.trim();
  
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
