// ============================================================================
// URNA ELETRÔNICA - votacao.js (Correções: Limite de Dígitos, Voto Nulo, Chave Numérica)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Liberar o aviso de volume inicial
    const btnLiberarVolume = document.getElementById('btnLiberarVolume');
    const volumeBlocker = document.getElementById('volume-blocker');

    if (btnLiberarVolume && volumeBlocker) {
        btnLiberarVolume.addEventListener('click', () => {
            volumeBlocker.style.display = 'none';
        });
    }

    // Container principal onde as telas do fluxo serão injetadas
    const appMain = document.getElementById('app-main');
    const nomeVotacaoDisplay = document.getElementById('nome-votaçoes-display');

    // Telas fixas de overlay e modais
    const masterModal = document.getElementById('master-modal');
    const inputMaster = document.getElementById('input-master');
    const btnConfirmarMaster = document.getElementById('btnConfirmarMaster');
    const btnFecharMaster = document.getElementById('btnFecharMaster');
    const legendaContainer = document.getElementById('legenda-container');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownTimer = document.getElementById('countdown-timer');

    // Elementos de Áudio
    const beepSound = document.getElementById('beepSound');
    const confirmSound = document.getElementById('confirmSound');
    const alarmSound = document.getElementById('alarmSound');

    // Estado Global da Votação
    let configVotacao = {
        nomeVotacao: '',
        permiteBranco: false,
        permiteNulo: false,
        qtdDigitos: 2,
        candidatos: []
    };

    let acaoPendenteChave = null; // 'iniciar', 'cancelar', 'encerrar'
    let chaveRealMestra = "674267"; // Senha padrão da chave mestra (em dígitos reais)
    let legendaAtual = {};
    let digitosDigitados = "";

    // Iniciar o fluxo exibindo a tela de configuração inicial
    carregarTelaConfiguracao();

    // ========================================================================
    // TELA 1: CONFIGURAÇÃO INICIAL (NOME, BRANCO, NULO)
    // ========================================================================
    function carregarTelaConfiguracao() {
        if (nomeVotacaoDisplay) nomeVotacaoDisplay.innerText = "Configuração da Votação";

        appMain.innerHTML = `
            <div class="config-screen">
                <div class="input-group">
                    <label for="nome-votacao-input">Nome da Votação:</label>
                    <input type="text" id="nome-votacao-input" placeholder="Ex: Eleição Grêmio Estudantil" required>
                </div>

                <div class="checkbox-row">
                    <label class="checkbox-item">
                        <input type="checkbox" id="check-branco" checked> Permitir Voto em Branco
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="check-nulo" checked> Permitir Voto Nulo
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" id="btn-ir-candidatos" class="btn-acao btn-confirma">Avançar para Candidatos</button>
                </div>
            </div>
        `;

        document.getElementById('btn-ir-candidatos').addEventListener('click', () => {
            const nomeInput = document.getElementById('nome-votacao-input').value.trim();
            if (!nomeInput) {
                alert("Por favor, informe o nome da votação.");
                return;
            }

            configVotacao.nomeVotacao = nomeInput;
            configVotacao.permiteBranco = document.getElementById('check-branco').checked;
            configVotacao.permiteNulo = document.getElementById('check-nulo').checked;

            carregarTelaCandidatos();
        });
    }

    // ========================================================================
    // TELA 2: CADASTRO DE CANDIDATOS E QUANTIDADE DE DÍGITOS (ATÉ 5)
    // ========================================================================
    function carregarTelaCandidatos() {
        if (nomeVotacaoDisplay) nomeVotacaoDisplay.innerText = configVotacao.nomeVotacao;

        appMain.innerHTML = `
            <div class="form-candidatos-screen">
                <div class="input-group">
                    <label for="qtd-digitos">Quantidade de Dígitos dos Códigos de Votação:</label>
                    <select id="qtd-digitos">
                        <option value="2">2 Dígitos</option>
                        <option value="3">3 Dígitos</option>
                        <option value="4">4 Dígitos</option>
                        <option value="5">5 Dígitos</option>
                    </select>
                </div>

                <div id="candidatos-container" class="candidatos-wrapper">
                    <!-- Blocos injetados via JS -->
                </div>

                <div style="display: flex; gap: 10px;">
                    <button type="button" id="btn-add-candidato" class="btn-acao btn-branco" style="flex: 1;">+ Adicionar Candidato</button>
                </div>

                <div class="form-actions" style="margin-top: 15px;">
                    <button type="button" id="btn-voltar-config" class="btn-acao btn-corrige">Voltar</button>
                    <button type="button" id="btn-salvar-concluir" class="btn-acao btn-confirma">Concluir e Iniciar Votação</button>
                </div>
            </div>
        `;

        const containerCandidatos = document.getElementById('candidatos-container');
        const btnAddCandidato = document.getElementById('btn-add-candidato');

        function adicionarBloco(primeiro = '', completo = '', fantasia = '', codigo = '') {
            const bloco = document.createElement('div');
            bloco.className = 'candidato-bloco';
            bloco.innerHTML = `
                <div class="bloco-linha">
                    <input type="text" class="primeironome" placeholder="Primeiro Nome" value="${primeiro}" required>
                    <input type="text" class="nomecompleto" placeholder="Nome Completo" value="${completo}" required>
                </div>
                <div class="bloco-linha">
                    <input type="text" class="nomefantasia" placeholder="Nome Fantasia" value="${fantasia}" required>
                    <input type="number" class="codigo" placeholder="Código Numérico" value="${codigo}" required>
                </div>
                <button type="button" class="btn-acao btn-alerta btn-remover" style="padding: 5px; font-size: 11px; margin-top: 5px;">Excluir Candidato</button>
            `;

            containerCandidatos.appendChild(bloco);
            atualizarRegraExclusao();

            bloco.querySelector('.btn-remover').addEventListener('click', () => {
                const blocos = containerCandidatos.querySelectorAll('.candidato-bloco');
                if (blocos.length > 2) {
                    bloco.remove();
                    atualizarRegraExclusao();
                } else {
                    alert("Atenção: É obrigatório manter no mínimo 2 candidatos!");
                }
            });
        }

        function atualizarRegraExclusao() {
            const blocos = containerCandidatos.querySelectorAll('.candidato-bloco');
            blocos.forEach((b, index) => {
                const btnRemover = b.querySelector('.btn-remover');
                if (index === blocos.length - 1 && blocos.length > 2) {
                    btnRemover.style.display = 'block';
                } else if (blocos.length <= 2) {
                    btnRemover.style.display = 'none';
                }
            });
        }

        // Criar 2 candidatos iniciais obrigatórios
        adicionarBloco();
        adicionarBloco();

        btnAddCandidato.addEventListener('click', () => {
            adicionarBloco();
        });

        document.getElementById('btn-voltar-config').addEventListener('click', () => {
            carregarTelaConfiguracao();
        });

        document.getElementById('btn-salvar-concluir').addEventListener('click', () => {
            configVotacao.qtdDigitos = parseInt(document.getElementById('qtd-digitos').value);

            const blocos = containerCandidatos.querySelectorAll('.candidato-bloco');
            configVotacao.candidatos = [];
            let erro = false;

            blocos.forEach(b => {
                const prim = b.querySelector('.primeironome').value.trim();
                const comp = b.querySelector('.nomecompleto').value.trim();
                const fant = b.querySelector('.nomefantasia').value.trim();
                const cod = b.querySelector('.codigo').value.trim();

                if (!prim || !comp || !fant || !cod) {
                    erro = true;
                }

                configVotacao.candidatos.push({
                    primeironome: prim,
                    nomecompleto: comp,
                    nomefantasia: fant,
                    codigo: cod
                });
            });

            if (erro) {
                alert("Por favor, preencha todos os campos de todos os candidatos.");
                return;
            }

            // Exigir chave mestra para iniciar oficialmente a votação
            acaoPendenteChave = 'iniciar';
            abrirChaveMestra();
        });
    }

    // ========================================================================
    // LOGICA DA CHAVE MESTRA (COM APENAS NÚMEROS E VALIDAÇÃO VIA LEGENDA)
    // ========================================================================
    function abrirChaveMestra() {
        masterModal.style.display = 'flex';
        inputMaster.value = '';
        gerarLegendaAleatoria();
    }

    function gerarLegendaAleatoria() {
        legendaAtual = {};
        let pares = [];
        let reais = [0,1,2,3,4,5,6,7,8,9];
        let mascarados = [...reais].sort(() => Math.random() - 0.5);

        for (let i = 0; i < reais.length; i++) {
            legendaAtual[reais[i]] = mascarados[i]; // chave real vira o mascarado exibido
            pares.push(`${reais[i]} vira ${mascarados[i]}`);
        }

        legendaContainer.dataset.textoLegenda = pares.join(' | ');
        legendaContainer.innerText = "[ Segure a tecla 'W' para ver a legenda ]";
    }

    // Impede digitação de letras no input da chave mestra (apenas números permitidos)
    if (inputMaster) {
        inputMaster.addEventListener('keypress', (e) => {
            // Permite apenas teclas numéricas de 0 a 9
            if (e.key < '0' || e.key > '9') {
                e.preventDefault();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'w' && masterModal.style.display === 'flex') {
            legendaContainer.innerText = legendaContainer.dataset.textoLegenda;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'w' && masterModal.style.display === 'flex') {
            legendaContainer.innerText = "[ Segure a tecla 'W' para ver a legenda ]";
        }
    });

    if (btnConfirmarMaster) {
        btnConfirmarMaster.addEventListener('click', () => {
            let digitadoMascarado = inputMaster.value.trim();
            
            if (!digitadoMascarado) {
                alert("Por favor, digite a chave mestra.");
                return;
            }

            // Cria o dicionário inverso garantindo chaves em string para evitar falhas de tipo
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

            // Compara a senha convertida com a chave real mestra
            if (senhaConvertidaParaReal === chaveRealMestra) {
                masterModal.style.display = 'none';
                inputMaster.value = '';

                if (acaoPendenteChave === 'iniciar') {
                    configVotacao.candidatos.sort(() => Math.random() - 0.5);
                    carregarTelaUrna();
                } else if (acaoPendenteChave === 'cancelar') {
                    alert("Votação cancelada e aba apagada com sucesso.");
                    window.location.href = "menu.html";
                } else if (acaoPendenteChave === 'encerrar') {
                    alert("Votação encerrada com sucesso. Dados travados.");
                    window.location.href = "menu.html";
                }
            } else {
                alarmSound.currentTime = 0;
                alarmSound.play().catch(() => {});
                
                inputMaster.value = '';
                gerarLegendaAleatoria();
                
                alert("Chave Mestra incorreta! Legenda rebaralhada e campo limpo.");
            }
        });
    }

    if (btnFecharMaster) {
        btnFecharMaster.addEventListener('click', () => {
            masterModal.style.display = 'none';
            acaoPendenteChave = null;
        });
    }

    // ========================================================================
    // TELA 3: INTERFACE DA URNA ELETRÔNICA
    // ========================================================================
    function carregarTelaUrna() {
        if (nomeVotacaoDisplay) nomeVotacaoDisplay.innerText = configVotacao.nomeVotacao;

        appMain.innerHTML = `
            <div class="urna-layout">
                <div class="urna-visor">
                    <div class="visor-instrucao">SEU VOTO PARA</div>
                    <div class="visor-conteudo">
                        <div style="font-size: 14px; color: #666;">Número digitado:</div>
                        <div id="visor-digitos-preenchidos" style="font-size: 32px; font-weight: bold; letter-spacing: 5px; min-height: 40px;"></div>
                        <div id="visor-info-candidato" class="candidato-info-visor">Aguardando digitação...</div>
                    </div>
                    <div style="font-size: 11px; color: #777; border-top: 1px solid #ccc; padding-top: 5px;">
                        Aperte o botão BRANCO para votar em Branco.<br>
                        Aperte CORRIGIR para refazer o voto.<br>
                        Aperte CONFIRMAR para gravar o voto.
                    </div>
                </div>

                <div class="keypad-area">
                    <div id="urna-keypad" class="keypad">
                        <!-- Teclado gerado dinamicamente -->
                    </div>
                    <div class="urna-botoes-inferiores">
                        <button type="button" id="btn-branco-urna" class="btn-acao btn-branco">BRANCO</button>
                        <button type="button" id="btn-corrige" class="btn-acao btn-corrige">CORRIGIR</button>
                        <button type="button" id="btn-confirma" class="btn-acao btn-confirma">CONFIRMAR</button>
                    </div>
                </div>
            </div>

            <div class="urna-admin-panel">
                <button type="button" id="btn-cancelar-votacao" class="btn-acao btn-alerta">Cancelar Votação</button>
                <button type="button" id="btn-encerrar-votacao" class="btn-acao btn-corrige">Encerrar Votação</button>
            </div>
        `;

        // Controle do botão Branco de acordo com a configuração
        const btnBrancoUI = document.getElementById('btn-branco-urna');
        if (btnBrancoUI) {
            btnBrancoUI.style.display = configVotacao.permiteBranco ? 'block' : 'none';
        }

        renderizarTecladoNumerico();
        configurarEventosUrna();
    }

    function renderizarTecladoNumerico() {
        const keypadContainer = document.getElementById('urna-keypad');
        if (!keypadContainer) return;
        keypadContainer.innerHTML = '';

        // Números de 0 a 9 embaralhados aleatoriamente
        let numeros = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        let gridBotoes = numeros.slice(0, 9);
        let botaoIsolado = numeros[9];

        gridBotoes.forEach(num => {
            let btn = document.createElement('button');
            btn.type = 'button';
            btn.innerText = num;
            btn.addEventListener('click', () => {
                beepSound.currentTime = 0;
                beepSound.play().catch(() => {});

                if (digitosDigitados.length < configVotacao.qtdDigitos) {
                    digitosDigitados += num.toString();
                    atualizarVisorUrna();
                }
            });
            keypadContainer.appendChild(btn);
        });

        // O décimo botão centralizado embaixo estruturado no layout [X] [X] [X] / [X]
        let btnZero = document.createElement('button');
        btnZero.type = 'button';
        btnZero.innerText = botaoIsolado;
        btnZero.className = 'btn-zero';
        btnZero.addEventListener('click', () => {
            beepSound.currentTime = 0;
            beepSound.play().catch(() => {});

            if (digitosDigitados.length < configVotacao.qtdDigitos) {
                digitosDigitados += botaoIsolado.toString();
                atualizarVisorUrna();
            }
        });
        keypadContainer.appendChild(btnZero);
    }

    function atualizarVisorUrna() {
        const visorDigitos = document.getElementById('visor-digitos-preenchidos');
        const visorInfoCandidato = document.getElementById('visor-info-candidato');

        if (visorDigitos) visorDigitos.innerText = digitosDigitados;

        if (digitosDigitados.length === configVotacao.qtdDigitos) {
            let candidatoEncontrado = configVotacao.candidatos.find(c => c.codigo === digitosDigitados);
            if (candidatoEncontrado) {
                if (visorInfoCandidato) {
                    visorInfoCandidato.innerHTML = `
                        <p>Primeiro Nome: <strong>${candidatoEncontrado.primeironome}</strong></p>
                        <p>Nome Completo: ${candidatoEncontrado.nomecompleto}</p>
                        <p>Nome Fantasia: ${candidatoEncontrado.nomefantasia}</p>
                    `;
                }
            } else {
                if (visorInfoCandidato) {
                    if (configVotacao.permiteNulo) {
                        visorInfoCandidato.innerHTML = `<p style="color: red; font-weight: bold;">VOTO NULO</p>`;
                    } else {
                        visorInfoCandidato.innerHTML = `<p style="color: orange; font-weight: bold;">CÓDIGO INVÁLIDO (VOTO NULO DESATIVADO)</p>`;
                    }
                }
            }
        } else {
            if (visorInfoCandidato) {
                visorInfoCandidato.innerHTML = "Digite o número do candidato...";
            }
        }
    }

    function limparVisorUrna() {
        digitosDigitados = "";
        const visorDigitos = document.getElementById('visor-digitos-preenchidos');
        const visorInfoCandidato = document.getElementById('visor-info-candidato');

        if (visorDigitos) visorDigitos.innerText = "";
        if (visorInfoCandidato) visorInfoCandidato.innerHTML = "Aguardando digitação...";
        renderizarTecladoNumerico(); // Reembaralha o teclado ao corrigir
    }

    function configurarEventosUrna() {
        const btnCorrigeUrna = document.getElementById('btn-corrige');
        if (btnCorrigeUrna) {
            btnCorrigeUrna.addEventListener('click', () => {
                beepSound.play().catch(() => {});
                limparVisorUrna();
            });
        }

        const btnBrancoUrna = document.getElementById('btn-branco-urna');
        if (btnBrancoUrna) {
            btnBrancoUrna.addEventListener('click', () => {
                if (!configVotacao.permiteBranco) return;
                beepSound.play().catch(() => {});
                digitosDigitados = "BRANCO";
                const visorDigitos = document.getElementById('visor-digitos-preenchidos');
                const visorInfoCandidato = document.getElementById('visor-info-candidato');
                if (visorDigitos) visorDigitos.innerText = "BRANCO";
                if (visorInfoCandidato) visorInfoCandidato.innerHTML = `<p style="font-weight: bold;">VOTO EM BRANCO</p>`;
            });
        }

        const btnConfirmaUrna = document.getElementById('btn-confirma');
        if (btnConfirmaUrna) {
            btnConfirmaUrna.addEventListener('click', () => {
                if (digitosDigitados.length === 0) return;

                // Validação rigorosa: se o voto for nulo (não é candidato e não é branco) e o voto nulo estiver desativado, bloqueia a confirmação!
                if (digitosDigitados !== "BRANCO") {
                    let candidatoEncontrado = configVotacao.candidatos.find(c => c.codigo === digitosDigitados);
                    if (!candidatoEncontrado && !configVotacao.permiteNulo) {
                        alarmSound.play().catch(() => {});
                        alert("Voto Nulo está desativado nesta votação! Digite um código de candidato válido ou corrija.");
                        return; // Bloqueia a confirmação
                    }
                }

                confirmSound.currentTime = 0;
                confirmSound.play().catch(() => {});

                dispararContagemRegressiva();
            });
        }

        const btnCancelarVotacao = document.getElementById('btn-cancelar-votacao');
        if (btnCancelarVotacao) {
            btnCancelarVotacao.addEventListener('click', () => {
                alarmSound.play().catch(() => {});
                acaoPendenteChave = 'cancelar';
                abrirChaveMestra();
            });
        }

        const btnEncerrarVotacao = document.getElementById('btn-encerrar-votacao');
        if (btnEncerrarVotacao) {
            btnEncerrarVotacao.addEventListener('click', () => {
                alarmSound.play().catch(() => {});
                acaoPendenteChave = 'encerrar';
                abrirChaveMestra();
            });
        }
    }

    function dispararContagemRegressiva() {
        if (countdownOverlay) countdownOverlay.style.display = 'flex';
        let segundosRestantes = 5;
        if (countdownTimer) countdownTimer.innerText = segundosRestantes;

        let intervalo = setInterval(() => {
            segundosRestantes--;
            if (countdownTimer) countdownTimer.innerText = segundosRestantes;

            if (segundosRestantes <= 0) {
                clearInterval(intervalo);
                if (countdownOverlay) countdownOverlay.style.display = 'none';
                limparVisorUrna();
            }
        }, 1000);
    }
});
