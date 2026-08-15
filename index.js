// Credenciais de Acesso do Operador (Módulo 1.0.1)
const USUARIO_CORRETO = "SELMA";
const SENHA_PI_CORRETA = "3.1415926535";

// ==========================================================
// 1. PASSO 1: LOGIN DO OPERADOR (PRIMEIRA BARREIRA)
// ==========================================================
function fazerLogin(event) {
    event.preventDefault();

    const usuarioDigitado = document.getElementById("login-usuario").value.trim();
    const senhaDigitada = document.getElementById("senha-usuario").value.trim();

    // Valida credenciais rigorosas do Operador
    if (usuarioDigitado === USUARIO_CORRETO && senhaDigitada === SENHA_PI_CORRETA) {
        // Marca sessão como autenticada no navegador
        sessionStorage.setItem("autenticado", "true");

        // Login aprovado: agora sim verifica se a Chave Mestra existe na nuvem
        verificarChaveEAvancar();
    } else {
        alert("Usuário ou Senha incorretos! Verifique os dados digitados.");
        document.getElementById("senha-usuario").value = "";
    }
}

// ==========================================================
// 2. PASSO 2: CHECA A CHAVE MESTRA NA NUVEM (PÓS-LOGIN)
// ==========================================================
function verificarChaveEAvancar() {
    if (typeof URL_APPS_SCRIPT === "undefined" || !URL_APPS_SCRIPT || URL_APPS_SCRIPT.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) {
        alert("Atenção: Configure a URL do Apps Script no arquivo config.js!");
        return;
    }

    fetch(`${URL_APPS_SCRIPT}?acao=checarChave`)
    .then(response => response.json())
    .then(data => {
        if (data.chaveExiste) {
            // Se a chave já existe, vai direto para o Menu Principal!
            window.location.href = "menu.html";
        } else {
            // Se NÃO existe (primeiro uso), esconde o login e exibe a tela de cadastro
            document.getElementById("aba-login").classList.add("escondido");
            document.getElementById("aba-chave-mestra").classList.remove("escondido");
        }
    })
    .catch(error => {
        console.error("Erro ao verificar Chave Mestra:", error);
        alert("Erro ao conectar com a nuvem. Redirecionando para o menu...");
        window.location.href = "menu.html";
    });
}

// ==========================================================
// 3. PASSO 3: SALVAR CHAVE MESTRA (E IR AO MENU)
// ==========================================================
function salvarChaveMestra(event) {
    event.preventDefault();

    const novaChave = document.getElementById("nova-chave").value.trim();

    // Validação estrita: exatamente 6 números
    if (novaChave.length !== 6 || isNaN(novaChave)) {
        alert("A Chave Mestra deve conter exatamente 6 números!");
        return;
    }

    // Embaralhamento seguro em Base64
    const chaveEmbaralhada = btoa(novaChave);

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            acao: "salvarChave",
            chaveMestra: chaveEmbaralhada
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "sucesso") {
            alert("Chave Mestra cadastrada com sucesso!");
            // Vai direto para o Menu Principal
            window.location.href = "menu.html";
        } else {
            alert("Erro ao salvar Chave Mestra no servidor.");
        }
    })
    .catch(error => {
        console.error("Erro de conexão ao salvar Chave Mestra:", error);
        alert("Falha de conexão com a planilha. Verifique a URL no config.js.");
    });
}

