// ============================================================================
// RESULTADOS E APURAÇÃO - resultados.js (Integrado com Chave Mestra e Planilha)
// ============================================================================

let cardAlvoId = null;
let nomeVotacaoAlvo = "";
let textoExigido = "";

// Variáveis de controle da Chave Mestra (Mesmo padrão da Urna)
let chaveRealMestra = "674267"; // Senha padrão (pode ser ajustada pelo localStorage)
let legendaAtual = {};
let acaoPendenteResultados = null; // 'visualizar' ou 'excluir'

document.addEventListener('DOMContentLoaded', () => {
    carregarVotacoesDasAbas();
    configurarEventosChaveMestra();
});

// ============================================================================
// 1. CARREGAR VOTAÇÕES DAS ABAS DA PLANILHA (Da 2ª aba em diante)
// ============================================================================
function carregarVotacoesDasAbas() {
    const gridVotacoes = document.getElementById('gridVotacoes');
    if (!gridVotacoes) return;

    if (typeof URL_API !== 'undefined' && URL_API) {
        fetch(`${URL_API}?acao=listarAbas`)
            .then(response => response.json())
            .then(data => {
                const cardsAntigos = gridVotacoes.querySelectorAll('.card-votacao:not(#card-legenda)');
                cardsAntigos.forEach(c => c.remove());

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
                <span class="status-badge">Concluída / Salva</span>
            </div>
            <p class="status-desc">Apuração protegida por Chave Mestra sincronizada com a planilha.</p>
        </div>
        <div class="card-actions">
            <button class="btn-acao btn-ver" onclick="solicitarAcessoVisualizacao('${nomeVotacao}')">Visualizar Resultados</button>
            <button class="btn-acao btn-excluir" onclick="iniciarExclusao('${idUnico}', '${nomeVotacao}')">Excluir</button>
        </div>
    `;

    gridVotacoes.appendChild(card);
}

// ============================================================================
// 2. SISTEMA DE CHAVE MESTRA BLINDADA (Mesmo padrão da Urna)
// ============================================================================
function solicitarAcessoVisualizacao(nomeVotacao) {
    nomeVotacaoAlvo = nomeVotacao;
    acaoPendenteResultados = 'visualizar';
    abrirChaveMestra();
}

function abrirChaveMestra() {
    let modal = document.getElementById('master-modal');
    if (!modal) {
        // Se o modal não estiver no HTML de resultados, cria ele dinamicamente na hora para garantir funcionamento
        criarModalChaveMestraDinamico();
        modal = document.getElementById('master-modal');
    }
    
    modal.style.display = 'flex';
    document.getElementById('input-master').value = '';
    gerarLegendaAleatoria();
}

function criarModalChaveMestraDinamico() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'master-modal';
    modalDiv.className = 'master-modal';
    modalDiv.style.display = 'none';
    modalDiv.innerHTML = `
        <div class="master-content">
            <h3>🔑 Acesso Administrativo - Chave Mestra</h3>
            <p>Digite a Chave Mestra:</p>
            <input type="password" id="input-master" placeholder="Digite os dígitos...">
            <div id="legenda-container" class="legenda-container"></div>
            <button id="btnConfirmarMaster" class="btn-acao btn-confirma">Confirmar Chave</button>
            <button id="btnFecharMaster" class="btn-acao btn-corrige">Fechar</button>
        </div>
    `;
    document.body.appendChild(modalDiv);
    configurarEventosChaveMestra();
}

function gerarLegendaAleatoria() {
    const legendaContainer = document.getElementById('legenda-container');
    if (!legendaContainer) return;

    legendaAtual = {};
    let pares = [];
    let reais = [0,1,2,3,4,5,6,7,8,9];
    let mascarados = [...reais].sort(() => Math.random() - 0.5);

    for (let i = 0; i < reais.length; i++) {
        legendaAtual[reais[i]] = mascarados[i];
        pares.push(`${reais[i]} vira ${mascarados[i]}`);
    }

    legendaContainer.dataset.textoLegenda = pares.join(' | ');
    legendaContainer.innerText = "[ Segure a tecla 'W' para ver a legenda ]";
}

function configurarEventosChaveMestra() {
    const inputMaster = document.getElementById('input-master');
    const legendaContainer = document.getElementById('legenda-container');
    const btnConfirmarMaster = document.getElementById('btnConfirmarMaster');
    const btnFecharMaster = document.getElementById('btnFecharMaster');
    const masterModal = document.getElementById('master-modal');

    if (inputMaster) {
        inputMaster.addEventListener('keypress', (e) => {
            if (e.key < '0' || e.key > '9') {
                e.preventDefault();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'w' && masterModal && masterModal.style.display === 'flex') {
            if (legendaContainer) legendaContainer.innerText = legendaContainer.dataset.textoLegenda;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'w' && masterModal && masterModal.style.display === 'flex') {
            if (legendaContainer) legendaContainer.innerText = "[ Segure a tecla 'W' para ver a legenda ]";
        }
    });

    if (btnConfirmarMaster) {
        btnConfirmarMaster.onclick = () => {
            let digitadoMascarado = inputMaster.value.trim();
            if (!digitadoMascarado) {
                alert("Por favor, digite a chave mestra.");
                return;
            }

            let chaveInvertida = {};
            for (let real in legendaAtual) {
                let mascarado = legendaAtual[real];
                chaveInvertida[mascarado.toString()] = real.toString();
            }

            let senhaConvertidaParaReal = "";
            for (let i = 0; i < digitadoMascarado.length; i++) {
                let digitoChar = digitadoMascarado[i];
                if (chaveInvertida[digitoChar] !== undefined) {
                    senhaConvertidaParaReal += chaveInvertida[digitoChar];
                }
            }

            // Verifica se a senha salva no localStorage existe, senão usa a padrão
            const chaveMestraSalva = localStorage.getItem("chaveMestra") || chaveRealMestra;

            if (senhaConvertidaParaReal === chaveMestraSalva) {
                masterModal.style.display = 'none';
                inputMaster.value = '';

                if (acaoPendenteResultados === 'visualizar') {
                    executarVisualizacion(nomeVotacaoAlvo);
                }
            } else {
                inputMaster.value = '';
                gerarLegendaAleatoria();
                alert("Chave Mestra incorreta! Legenda rebaralhada.");
            }
        };
    }

    if (btnFecharMaster) {
        btnFecharMaster.onclick = () => {
            masterModal.style.display = 'none';
            acaoPendenteResultados = null;
        };
    }
}

// ============================================================================
// 3. EXIBIÇÃO DINÂMICA DA APURAÇÃO (Na mesma página)
// ============================================================================
function executarVisualizacion(nomeVotacao) {
    // Alterna para o painel de resultados detalhados sem precisar de outro HTML
    let visaoLista = document.getElementById('visaoLista') || document.getElementById('gridVotacoes');
    let tituloPagina = document.querySelector('header h1');
    
    if (visaoLista) visaoLista.style.display = 'none';
    if (tituloPagina) tituloPagina.innerText = `Apuração: ${nomeVotacao}`;

    // Cria ou exibe o container de detalhes
    let containerDetalhes = document.getElementById('visaoDetalhes');
    if (!containerDetalhes) {
        containerDetalhes = document.createElement('main');
        containerDetalhes.id = 'visaoDetalhes';
        containerDetalhes.className = 'apresentacao-container';
        containerDetalhes.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="btn-acao btn-corrige" onclick="voltarParaListaResultados()">← Voltar para Lista</button>
            </div>
            <div id="container-resultados" class="grid-resultados">
                <p class="carregando-texto">Buscando dados da planilha...</p>
            </div>
        `;
        document.body.appendChild(containerDetalhes);
    } else {
        containerDetalhes.style.display = 'block';
    }

    carregarDadosDaPlanilha(nomeVotacao);
}

function voltarParaListaResultados() {
    const containerDetalhes = document.getElementById('visaoDetalhes');
    const visaoLista = document.getElementById('gridVotacoes');
    const tituloPagina = document.querySelector('header h1');

    if (containerDetalhes) containerDetalhes.style.display = 'none';
    if (visaoLista) visaoLista.style.display = 'grid';
    if (tituloPagina) tituloPagina.innerText = "Votações Concluídas";
}

function carregarDadosDaPlanilha(nomeVotacao) {
    const containerResultados = document.getElementById('container-resultados');
    if (!containerResultados) return;

    if (typeof URL_API !== 'undefined' && URL_API) {
        fetch(`${URL_API}?acao=buscarResultados&votacao=${encodeURIComponent(nomeVotacao)}`)
            .then(response => response.json())
            .then(dados => {
                containerResultados.innerHTML = '';
                if (dados && dados.length > 0) {
                    dados.forEach(candidato => {
                        const card = document.createElement('div');
                        card.className = 'card-candidato-resultado';
                        card.innerHTML = `
                            <h3>${candidato.nome || candidato.primeironome}</h3>
                            <p>Votos: <strong>${candidato.votos || 0}</strong></p>
                        `;
                        containerResultados.appendChild(card);
                    });
                } else {
                    containerResultados.innerHTML = `<p>Nenhum dado encontrado para esta votação.</p>`;
                }
            })
            .catch(() => {
                containerResultados.innerHTML = `<p style="color:red;">Erro ao conectar com a planilha.</p>`;
            });
    }
}

// ============================================================================
// 4. EXCLUSÃO BLINDADA COM TEXTO EXATO
// ============================================================================
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
