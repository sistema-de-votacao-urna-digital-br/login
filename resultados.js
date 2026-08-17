// resultados.js - Lógica de Apuração, Chave Mestra e Exclusão Blindada

let cardAlvoId = null;
let textoExigido = "";

// Chave Mestra padrão do sistema (sincronizada com o módulo de configuração)
const CHAVE_MESTRA_PADRAO = "123456"; 

function iniciarExclusao(cardId, nomeVotacao) {
    cardAlvoId = cardId;
    textoExigido = `Excluir "${nomeVotacao}."`;
    
    document.getElementById('instrucaoExclusao').innerText = `Para confirmar a exclusão desta votação, digite exatamente isto no campo abaixo: ${textoExigido}`;
    document.getElementById('inputConfirmacao').value = "";
    document.getElementById('btnConfirmarExclusao').disabled = true;
    document.getElementById('btnConfirmarExclusao').style.opacity = "0.5";
    
    document.getElementById('modalExclusao').style.display = 'flex';
}

function fecharModalExclusao() {
    document.getElementById('modalExclusao').style.display = 'none';
    cardAlvoId = null;
    textoExigido = "";
}

const inputConfirmacaoEl = document.getElementById('inputConfirmacao');
if (inputConfirmacaoEl) {
    inputConfirmacaoEl.addEventListener('input', function() {
        const valorDigitado = this.value.trim();
        const btnConfirmar = document.getElementById('btnConfirmarExclusao');

        if (valorDigitado === textoExigido) {
            btnConfirmar.disabled = false;
            btnConfirmar.style.opacity = "1";
        } else {
            btnConfirmar.disabled = true;
            btnConfirmar.style.opacity = "0.5";
        }
    });
}

function executarExclusao() {
    fecharModalExclusao();
    if (cardAlvoId) {
        const card = document.getElementById(cardAlvoId);
        if (card) {
            // Mantém visível por 2 segundos antes da animação de recolhimento
            setTimeout(() => {
                card.classList.add('apagando');
                setTimeout(() => {
                    card.remove();
                }, 500); // Sincronizado com a transição CSS
            }, 2000);
        }
    }
}

function abrirConfiguracao(nomeVotacao) {
    const senhaInformada = prompt(`Ação protegida. Digite a Chave Mestra para acessar "${nomeVotacao}":`);
    
    if (senhaInformada === null) {
        return;
    }

    const chaveMestraSalva = localStorage.getItem("chaveMestra") || CHAVE_MESTRA_PADRAO;

    if (senhaInformada === chaveMestraSalva) {
        localStorage.setItem("votacaoAtiva", nomeVotacao);
        window.location.href = "apresentacao.html";
    } else {
        alert("Chave Mestra incorreta! Acesso negado.");
    }
}
