// =========================================================================
// CONEXÃO COM O GOOGLE APPS SCRIPT (BANCO DE DADOS NA NUVEM)
// =========================================================================
// Lembre-se de colar a sua URL de implantação do Apps Script abaixo:
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwwKB2Fb9u2e0vwlwRH1bvIcaCVrO4GqBMPSxKFRazp3H_7S5mSwgTizIiW9wLw9jcb/exec";

// Credenciais de Acesso do Operador (Módulo 1.0.1)
const USUARIO_CORRETO = "SELMAfroisDAsilvaBOTELHO";
const SENHA_PI_CORRETA = "3.14159265358979323846264338327";

// =========================================================================
// INICIALIZAÇÃO E CHECAGEM DA CHAVE MESTRA
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    checarChaveMestra();
});

// 1.0. Consulta o Apps Script via GET para verificar se a Chave Mestra existe
function checarChaveMestra() {
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) {
        console.warn("URL do Apps Script não configurada ainda em index.js!");
        return;
    }

    fetch(`${URL_APPS_SCRIPT}?acao=checarChave`)
        .then(response => response.json())
        .then(data => {
            if (!data.chaveExiste) {
                // Se NÃO existe chave cadastrada, esconde a tela de login e exibe a de cadastro
                document.getElementById("aba-login").classList.add("escondido");
                document.getElementById("aba-chave-mestra").classList.remove("escondido");
            }
        })
        .catch(error => {
            console.error("Erro ao verificar Chave Mestra no servidor:", error);
        });
}

// =========================================================================
// 1.0.1. AUTENTICAÇÃO DO OPERADOR (LOGIN)
// =========================================================================
function fazerLogin(event) {
    event.preventDefault();
    
    const usuarioDigitado = document.getElementById("login-usuario").value.trim();
    const senhaDigitada = document.getElementById("senha-usuario").value.trim();

    // Validação estrita do usuário e senha do Pi
    if (usuarioDigitado === USUARIO_CORRETO && senhaDigitada === SENHA_PI_CORRETA) {
        // Marca a sessão como autenticada e vai para o Menu Principal (1.1)
        sessionStorage.setItem("autenticado", "true");
        window.location.href = "menu.html";
    } else {
        alert("Usuário ou Senha incorretos! Verifique os dados digitados.");
        document.getElementById("senha-usuario").value = "";
    }
}

// =========================================================================
// 1.0. CADASTRO DA CHAVE MESTRA (PRIMEIRO ACESSO)
// =========================================================================
function salvarChaveMestra(event) {
    event.preventDefault();
    
    const novaChave = document.getElementById("nova-chave").value.trim();

    // Validação: exatamente 6 dígitos numéricos
    if (novaChave.length !== 6 || isNaN(novaChave)) {
        alert("A Chave Mestra deve conter exatamente 6 números!");
        return;
    }

    // Embaralhamento em Base64 para envio seguro
    const chaveEmbaralhada = btoa(novaChave);

    // Envio POST para o Apps Script gravar na aba 'Configuracoes' da planilha
    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            tipo: "chaveMestra",
            chave: chaveEmbaralhada
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            alert("Chave Mestra cadastrada com sucesso na planilha!");
            // Retorna para a tela de Login do Operador
            document.getElementById("aba-chave-mestra").classList.add("escondido");
            document.getElementById("aba-login").classList.remove("escondido");
        } else {
            alert("Erro ao salvar Chave Mestra no servidor.");
        }
    })
    .catch(error => {
        console.error("Erro de conexão ao salvar Chave Mestra:", error);
        alert("Falha de conexão com a planilha. Verifique a URL do Apps Script.");
    });
}

