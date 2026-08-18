// resultados.js - Lógica de Apuração, Chave Mestra e Exclusão Blindada

let cardAlvoId = null;
let textoExigido = "";
const CHAVE_MESTRA_PADRAO = "123456"; 

// Ao carregar a página, busca as abas da planilha (da 2ª em diante) para listar as votações
document.addEventListener('DOMContentLoaded', () => {
    carregarVotacoesDasAbas();
});

function carregarVotacoesDasAbas() {
    const gridVotacoes = document.getElementById('gridVotacoes');
    const cardLegenda = document.getElementById('card-legenda');

    // Verifica se a ponte do config.js está ativa e se existe função para listar abas
    if (typeof URL_API !== 'undefined' && URL_API) {
        fetch(`${URL_API}?acao=listarAbas`)
            .then(response => response.json())
            .then(data => {
                // Remove os cards antigos (exceto a legenda)
                const cardsAntigos = gridVotacoes.querySelectorAll('.card-votacao:not(#card-legenda)');
                cardsAntigos.forEach(c => c.remove());

                // 'data' deve ser um array com os nomes das abas a partir da 2ª
                if (data && data.length > 0) {
                    data.forEach((nomeAba, index) => {
                        criarCardVotacao(nomeAba, `aba-${index}`);
                    });
                }
            })
            .catch(error => {
                console.error("Erro ao carregar abas da planilha:", error);
            });
    }
}

function criarCardVotacao(nomeVotacao, idUnico) {
    const gridVotacoes = document.getElementById('gridVotacoes');
    
    const card = document.createElement('div');
    card.className = 'card-votacao';
    card.id = idUnico;

    card.innerHTML = `
        <div>
            <div class="card-header">
                <span class="card-title">${nomeVotacao}</span>
                <span class="status-badge">Ativa / Concluída</span>
            </div>
            <p class="status-desc">Dados obtidos diretamente da aba correspondente na planilha.</p>
        </div>
        <div class="card-actions">
            <button class="btn-acao btn-ver" onclick="abrirConfiguracao('${nomeVotacao}')">Visualizar Resultados</button>
            <button class="btn-acao btn-excluir" onclick="iniciarExclusao('${idUnico}', '${nomeVotacao}')">Excluir</button>
        </div>
    `;

    gridVotacoes.appendChild(card);
}

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
            setTimeout(() => {
                card.classList.add('apagando');
                setTimeout(() => {
                    card.remove();
                }, 500); 
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
