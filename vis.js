const vis = {

    params : {

        iniciais : {

            valor_unidade: +10e9,
            margem: 2,
            espaco_inicial: 0,//400,

        },

        calculados : {
            
            tamanho: null, 
            qde_por_linha : null,
            ultima_linha : null,
            posicoes_linha_completa : [],
            primeiro_vencimento_a_excluir : null,
            primeiro_juros_a_excluir : null,
            ultimo_elemento : null, // estoque + juros
            linha_final_estoque_final : null

        },

        colors : {

            pega_do_css : function(color) {

                const style_root = getComputedStyle( document.documentElement );
                const value = style_root.getPropertyValue( '--tetris-' + color );
                return value;

            },

            popula : function() {

                vis.params.colors.valores.forEach(color => {
                    console.log(color);
                    vis.params.colors[color] = vis.params.colors.pega_do_css(color);
                })

            },

            valores : ['purple', 'green', 'red', 'yellow', 'orange', 'orangesemi' ,'blue', 'cyan']


        },

        steps : [

            'estoque_inicial',
            'juros',
            'vencimentos',
            'pagamento_vencimentos_outras_receitas',
            'pagamento_juros_outras_receitas',
            'emissao_refin',
            'emissao_vazamento'

        ]

    },

    refs : {

        container : ".tetris-container",
        buttons : ".back, .next",
        estoque : "[data-tipo='estoque_inicial'], [data-tipo='vencimentos_outras_fontes'], [data-tipo='vencimentos_refin']",
        juros : "[data-tipo='juros_outras_fontes'], [data-tipo='juros_refin']",
        juros_outras_fontes : "[data-tipo='juros_outras_fontes']",
        juros_refin : "[data-tipo='juros_refin']",
        vencimentos : "[data-tipo='vencimentos_outras_fontes'], [data-tipo='vencimentos_refin']",
        vencimentos_outras_fontes : "[data-tipo='vencimentos_outras_fontes']",
        deslocar_vencimentos : "[data-deslocar_vencimentos='true']",
        deslocar_juros : "[data-deslocar_juros='true']",
        pagamentos_refin : "[data-tipo='juros_refin'], [data-tipo='vencimentos_refin']",
        emissao_refin : "[data-tipo='emissao_refin']",
        emissao_vazamento : "[data-tipo='emissao_vazamento']",
        fantasmas_refin : "[data-tipo='fantasmas_refin']",

        setinha_saldo_anterior: '[data-setinha-saldo-anterior]',
        setinha_saldo_final: '[data-setinha-saldo-final]',
    
    },

    dims : {

        tetris : {

            h : null,
            w : null

        },

        largura_necessaria : null,
        altura_necessaria : null,
        qde_unidades : null,
        qde_unidades_inicial : null

    },

    data : {

        infos : {

            juros : {

                refin       : 210,//209,
                com_outras  : 200,//197,
                total       : 410//406

            },

            vencimentos : {

                refin       :  780,//773,
                com_outras  :  400, //394,
                total       : 1180//1167

            },

            vazamento : {

                resultado_bacen :  30,
                outras_despesas : 737,
                total           : 767

            },

            outras_fontes : 591,

            emissoes : {

                refin : {

                    principal : 780,
                    juros     : 210

                },

                vazamento : 767

            },

            estoque : {

                inicial : 4250,//4249,
                final   : 5010

            },

            pib: 7.4e12

        },

        vetores : {

            // formato elementos : { posx, posy, indice, tipo }

            estoque_inicial : null,
            juros_outras_fontes : null,
            juros_refin : null,
            vencimentos_outras_fontes : null,
            vencimentos_refin : null,

            vazamento : null,

            fantasmas_refin : null,

            todos : null

        },

        divida : [],

        cria_dataset : function(valor, tipo, posicao_inicial = 0) {

            //const qde_estoque_inicial = vis.grid.qde_unidades_estoque_inicial();

            const qde = vis.grid.helpers.calcula_qde_unidades(valor);

            console.log("Criando array de ", qde, " retangulos"); 
            
            const dataset = [];

            for (let unidade = 1; unidade <= qde; unidade++) {

                const indice = unidade + posicao_inicial;

                dataset[unidade-1] = {

                    unidade : unidade,
                    indice_geral : indice,
                    pos_x : ( (indice - 1) % vis.params.calculados.qde_por_linha ) + 1,
                    pos_y : Math.floor( (indice - 1) / vis.params.calculados.qde_por_linha ) + 1,
                    tipo : tipo,
                    proximo_pos_y_juros : null,
                    proximo_pos_y_vencimentos : null,
                    remover : null,
                    deslocar : null

                }

            }

            //vis.grid.ultima_posicao.set();

            vis.data.vetores[tipo] = dataset;

            //return dataset;

        },

        gera_datasets : function() {

            vis.data.divida = vis.data.cria_dataset(vis.data.infos.estoque.inicial * 1e9);

            // estoque inicial sem pagamentos
            vis.data.cria_dataset(
                (vis.data.infos.estoque.inicial - vis.data.infos.vencimentos.total) * 1e9,
                tipo = "estoque_inicial");

            let ultimo_indice = vis.data.vetores.estoque_inicial.length;

            // pagamentos com outras fontes
            vis.data.cria_dataset(
                vis.data.infos.vencimentos.com_outras * 1e9, 
                tipo = "vencimentos_outras_fontes", 
                posicao_inicial = ultimo_indice);

            vis.params.calculados.primeiro_vencimento_a_excluir = ultimo_indice + 1;

            ultimo_indice += vis.data.vetores.vencimentos_outras_fontes.length;

            // pagamentos refinanciamento
            vis.data.cria_dataset(
                vis.data.infos.vencimentos.refin * 1e9, 
                tipo = "vencimentos_refin",
                posicao_inicial = ultimo_indice);

            ultimo_indice += vis.data.vetores.vencimentos_refin.length;
            // para usar na animação
            vis.params.calculados.qde_linhas_estoque_inicial = Math.floor(ultimo_indice / vis.params.calculados.qde_por_linha);

            // juros com outras fontes
            vis.data.cria_dataset(
                vis.data.infos.juros.com_outras * 1e9, 
                tipo = "juros_outras_fontes",
                posicao_inicial = ultimo_indice);

            // para usar depois
            vis.params.calculados.primeiro_juros_a_excluir = ultimo_indice + 1;

            ultimo_indice += vis.data.vetores.juros_outras_fontes.length;

            // juros refinanciamento
            vis.data.cria_dataset(
                vis.data.infos.juros.refin * 1e9,
                tipo = "juros_refin", 
                posicao_inicial = ultimo_indice);

            ultimo_indice += vis.data.vetores.juros_refin.length;
            vis.params.calculados.ultimo_elemento = ultimo_indice;

            //apagar
            // // grid juros e vencimentos refinanciados
            // const ultimo_indice_estoque_sem_pgtos = vis.data.vetores.estoque_inicial.length;

            // vis.data.cria_dataset(
            //     (vis.data.infos.juros.refin + vis.data.infos.vencimentos.refin) * 1e9, 
            //     tipo = "grid_refin",
            //     posicao_inicial = ultimo_indice_estoque_sem_pgtos);

            // juros e vencimentos (pois são os que estarão sujeitos a serem deslocados)

            vis.data.vetores.todos = [

                ...vis.data.vetores.estoque_inicial,
                ...vis.data.vetores.vencimentos_outras_fontes,
                ...vis.data.vetores.vencimentos_refin,
                ...vis.data.vetores.juros_outras_fontes,
                ...vis.data.vetores.juros_refin

            ];
        
        },

    },

    textos_automaticos : {

        ref_textos : "js--text",

        refs : {

            // peguei a lista com um Array.from(document.querySelectorAll(".js--text")).map(d=>d.dataset.texto)
            
            "estoqueanterior" : () => vis.data.infos.estoque.inicial/1000,
            
            "juros" : () => vis.data.infos.juros.total,
            
            "estoque_final" : () => vis.data.infos.estoque.final/1000,

            "vazamento" : () => vis.data.infos.emissoes.vazamento,

            "refinanciamento" : () => vis.data.infos.emissoes.refin.juros + vis.data.infos.emissoes.refin.principal,

            "pib" : () => vis.data.infos.pib/1e12,

            "placar_estoque" : () => vis.textos_automaticos.formata_numeros(vis.data.infos.estoque.final*1e9),

            "placar_juros" : () => vis.textos_automaticos.formata_numeros(vis.data.infos.juros.total*1e9),

            "placar_vencimentos" : () => vis.textos_automaticos.formata_numeros((vis.data.infos.juros.total + vis.data.infos.vencimentos.total)*1e9)

        },

        populate : function() {

            document.querySelectorAll(".js--text").forEach(campo => {

                const tipo = campo.dataset.texto;

                campo.innerHTML = vis.textos_automaticos.refs[tipo]()

            })

        },

        formata_numeros : (valor) => valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    },

    sizing : {

        helpers : {

            tamanho_necessario : function(qde_na_dimensao) {

                return (qde_na_dimensao * (vis.params.calculados.tamanho + vis.params.iniciais.margem) + vis.params.iniciais.margem);
    
            }

        },

        pega_tamanho_tetris : function() {

            const height = document.querySelector(".tetris-container").getBoundingClientRect().height;

            const width  = document.querySelector(".tetris-container").getBoundingClientRect().width;

            vis.dims.tetris.h = height;
            vis.dims.tetris.w = width;

        },

        calcula_dimensoes_necessarias : function(valor) {

            const qde_unidades = vis.grid.helpers.calcula_qde_unidades(valor);
            const qde_linhas = vis.params.calculados.ultima_linha;

            vis.dims.altura_necessaria  = vis.sizing.helpers.tamanho_necessario(qde_linhas) + vis.params.iniciais.espaco_inicial;

            vis.dims.largura_necessaria = vis.sizing.helpers.tamanho_necessario(vis.params.calculados.qde_por_linha);

            vis.dims.qde_unidades       = qde_unidades;

            console.log("Precisaremos de ", qde_unidades, " unidades, ", qde_linhas, " linhas, e uma largura de ", vis.dims.largura_necessaria, "px e uma altura de ", vis.dims.altura_necessaria, "px.");

        },

        redimensiona_container : function() {

            const cont = document.querySelector(vis.refs.container);

            cont.style.width = vis.dims.largura_necessaria + "px";


        },

    },

    grid : {

        ultima_posicao : {

            set : function() {

                this.x = ( (vis.dims.qde_unidades - 1) % vis.params.calculados.qde_por_linha ) + 1;
                this.y = Math.floor( (vis.dims.qde_unidades - 1) / vis.params.calculados.qde_por_linha ) + 1;
                this.unidade = vis.dims.qde_unidades;
                this.index = vis.dims.qde_unidades - 1;

            },

            x : null,
            y : null,
            unidade : null,
            index : null

        },

        helpers : {

            calcula_qde_unidades : function(valor) {

                return Math.round(valor/vis.params.iniciais.valor_unidade);

            },

            pega_coordenadas : function(indice) {

                return ({

                    pos_x : ( (indice - 1) % vis.params.calculados.qde_por_linha ) + 1,
                    pos_y : Math.floor( (indice - 1) / vis.params.calculados.qde_por_linha ) + 1

                })

            }

        },

        qde_unidades_estoque_inicial : function() {

            const qde = this.helpers.calcula_qde_unidades(vis.data.infos.estoque.inicial*1e9);

            vis.dims.qde_unidades_inicial = qde;

            return qde;

        },

        calcula_parametros : function(valor) {

            const margem = vis.params.iniciais.margem;

            const qde_unidades = vis.grid.helpers.calcula_qde_unidades(valor);

            const area_unitaria = (
                (vis.dims.tetris.h - margem) * 
                (vis.dims.tetris.w - margem) ) / qde_unidades;

            const dim_unitaria = Math.sqrt(area_unitaria);
            
            const lado = Math.round(dim_unitaria - margem);

            const qde_por_linha = Math.ceil((vis.dims.tetris.w - vis.params.iniciais.margem) / dim_unitaria);

            const qde_linhas = Math.ceil((vis.dims.tetris.h - vis.params.iniciais.margem) / dim_unitaria);

            vis.params.calculados.tamanho = lado;
            vis.params.calculados.qde_por_linha = qde_por_linha;
            vis.params.calculados.ultima_linha = qde_linhas;

            // em seguida, calcula parametros para redimensionamento
        },

        calcula_posicao_apos_pagtos : function() {

            // tipo: juros ou vencimentos

            const elementos_a_remover = {};
            const deslocamentos = {};
            const posicoes_finais = {};

            for (tipo of ["juros", "vencimentos"]) {

                let posicao_inicial, valor, campo_de_proximo;

                if (tipo == "juros") {
    
                    posicao_inicial = vis.params.calculados.primeiro_juros_a_excluir;
                    valor = vis.data.infos.juros.com_outras*1e9;
                    campo_de_proximo = "proximo_pos_y_juros";
    
                } else {
    
                    console.log("aqui");
    
                    posicao_inicial = vis.params.calculados.primeiro_vencimento_a_excluir;
                    valor = vis.data.infos.vencimentos.com_outras*1e9;
                    campo_de_proximo = "proximo_pos_y_vencimento";
    
                }
    
                const qde_unidades = Math.round(valor/vis.params.iniciais.valor_unidade);
    
                const posicao_final = posicao_inicial + qde_unidades - 1;

                posicoes_finais[tipo] = posicao_final;
    
                //console.log("Para este pagamento de ", valor, ", apagaremos ", qde_unidades, " quadradinhos, a partir do indice ", posicao_inicial, ", até a posição ", posicao_final)  ;
    
                // linhas
    
                const linha_primeiro = vis.grid.helpers.pega_coordenadas(posicao_inicial).pos_y;
                const linha_ultimo   = vis.grid.helpers.pega_coordenadas(posicao_final).pos_y;
    
                //console.log("temos que apagar ", linha_ultimo - linha_primeiro - 1, "linhas completas: da linha", linha_primeiro, "até a :", linha_ultimo);
    
                // elementos a remover
    
                elementos_a_remover[tipo] = vis.data.vetores.todos.filter(d => d.indice_geral <= posicao_final & d.indice_geral >= posicao_inicial);

                //console.log("Elementos a remover, para o tipo ", tipo, ": ", elementos_a_remover[tipo]);
    
                // // elementos afetados
    
                // elementos_afetados[tipo] = vis.data.vetores.todos.filter(d => d.indice_geral > posicao_final);
    
    
                deslocamentos[tipo] = Array(vis.params.calculados.qde_por_linha + 1).fill(0)
    
                elementos_a_remover[tipo].forEach(d => {
    
                    deslocamentos[tipo][d.pos_x] += 1
    
                });

            }

            //console.log({posicoes_finais});

            // junta os elementos_a_remover

            const a_remover = [
                ...elementos_a_remover["juros"],
                ...elementos_a_remover["vencimentos"]
            ];

            //console.log(a_remover, elementos_a_remover["juros"], elementos_a_remover["vencimentos"]);

            //console.log("Deslocamentos", deslocamentos);

            vis.data.vetores.todos.forEach(d => {

                // se for um elemento dos pagamentos de vencimentos com outras fontes, vai só ser removido.

                if ( elementos_a_remover["vencimentos"].includes(d) ) {

                    d["remover_em_pagamento_vencimentos_outras"] = true;

                } else {

                    if (d.indice_geral > posicoes_finais["juros"]) {

                        // aqui sao os juros pagos com emissoes. vao cair após o pagamento de juros.
                        // mas também vao cair após o pagamento de vencimentos (vao ser capturados no if abaixo)

                        d['deslocamento_em_pagamento_juros_outras'] = deslocamentos.juros[d.pos_x] + deslocamentos.vencimentos[d.pos_x];

                        d["deslocar_juros"] = true;

                        d["proximo_pos_y_juros"] = d.pos_y - deslocamentos.juros[d.pos_x] - deslocamentos.vencimentos[d.pos_x]
                        // a posicao final dos juros, que estão em cima dos quadradinhos dos vencimentos, precisa ser complementada pelos deslocamentos dos vencimentos.
                    }
                    
                    if (d.indice_geral > posicoes_finais["vencimentos"]) {

                        d['deslocamento_em_pagamento_vencimentos_outras'] = deslocamentos.vencimentos[d.pos_x];

                        d["deslocar_vencimentos"] = true;

                        d["proximo_pos_y_vencimentos"] = d.pos_y - deslocamentos.vencimentos[d.pos_x]

                    }

                    if ( elementos_a_remover["juros"].includes(d) ) {

                        d["remover_em_pagamento_juros_outras"] = true;
    
                    }

                }

            });

        },

        calcula_fantasmas : function() {

            const vetor = vis.data.vetores.todos.filter(d => ['vencimentos_refin', 'juros_refin'].includes(d.tipo));

            vis.data.vetores.fantasmas_refin = vetor.map(d => (

                {
                    pos_x : d.pos_x,
                    pos_y : d.proximo_pos_y_juros ? d.proximo_pos_y_juros : d.proximo_pos_y_vencimentos,
                    tipo : 'fantasmas_refin'
                }

            ));

        },

        calcula_emissoes : function(tipo) {

            if (tipo == 'refin') {

                const fantasmas = vis.data.vetores.fantasmas_refin;

                const ultima_linha_fantasmas_refin = fantasmas.slice(-1)[0].pos_y;
                const linha_topo = vis.params.calculados.ultima_linha;

                const deslocamento = linha_topo - ultima_linha_fantasmas_refin;

                let vetor_emissao = fantasmas.map(el => (
                    {
                        pos_x : el.pos_x,
                        //pos_y : linha_atual,
                        pos_y : el.pos_y + deslocamento,
                        tipo : 'emissao_' + tipo,
                        ['deslocamento_em_emissao_' + tipo] : deslocamento,
                        pos_y_final : el.pos_y
    
                    })
                );

                vis.data.vetores['emissao_' + tipo] = vetor_emissao;

                // atualiza vetor todos
    
                vis.data.vetores.todos.push(...vetor_emissao);

                return;

            }

            console.log(tipo);

            // tipo = "refin" ou "vazamento"

            let valor, vetor_anterior, tipo_pos_y;

            if (tipo == "refin") {

                vetor_anterior = 'estoque_inicial';
                tipo_pos_y = 'pos_y'
                // as posições finais das emissões de refinanciamento vão ser em cima do estoque inicial

                valor = (
                    vis.data.infos.emissoes.refin.principal + 
                    vis.data.infos.emissoes.refin.juros ) * 1e9;

                    console.log("em refin, valor : ", valor)

            } else {

                vetor_anterior = 'emissao_refin';
                tipo_pos_y = 'pos_y_final'

                // as posições finais das emissões de vazamento vão ser em cima das emissões de refinanciamento


                valor = vis.data.infos.emissoes[tipo]*1e9;

            }

            

            const qde = vis.grid.helpers.calcula_qde_unidades(valor);

            console.log("Vamos emitir ", qde);

            // qual a última linha atual?

            const ultimo = vis.data.vetores[vetor_anterior].slice(-1)[0];
            const ultima_linha = ultimo[tipo_pos_y]//proximo_pos_y_juros;

            console.log("Ultimo, ultima linha", ultimo, ultima_linha);

            console.log('vetor anterior', vis.data.vetores[vetor_anterior]);

            // posicoes dessa ultima linha

            const elementos_da_ultima_linha = vis.data.vetores[vetor_anterior].filter(d => d[tipo_pos_y] == ultima_linha);

            const posicoes_elementos_ultima_linha = elementos_da_ultima_linha.map(d => d.pos_x);

            //console.log("Ultima linha", elementos_da_ultima_linha, posicoes_elementos_ultima_linha);

            // posicoes de uma linha completa

            const posicoes_linha_completa = vis.params.calculados.posicoes_linha_completa;

            // é preciso preencher a última linha?

            const posicoes_a_preencher = posicoes_linha_completa
              .filter(d => !posicoes_elementos_ultima_linha.includes(d));

            //console.log('posicoes a preencher ', posicoes_a_preencher);

            const qde_a_preencher_ultima_linha = posicoes_a_preencher.length;

            // quantas linhas adicionais serão necessárias?

            const qde_elementos_restantes = qde - qde_a_preencher_ultima_linha;

            const qde_linhas_adicionais = Math.ceil( qde_elementos_restantes / vis.params.calculados.qde_por_linha );

            // total de linhas a preencher:

            const total_linhas = qde_linhas_adicionais + ( qde_a_preencher_ultima_linha > 0 );

            // ultima linha após o preenchimento

            const ultima_linha_emissao = ultima_linha + total_linhas;

            // inicialmente, os quadradinhos ficarão no topo. Então a última linha do bloco vai ser a última linha do container

            const linha_topo = vis.params.calculados.ultima_linha;

            const deslocamento = linha_topo - ultima_linha_emissao + 1;

            // vamos gerar o vetor

            // primeiro os quadradinhos para preencher a última linha

            linha_atual = ultima_linha;

            let vetor_emissao = posicoes_a_preencher.map(x => (
                {
                    pos_x : x,
                    //pos_y : linha_atual,
                    pos_y : linha_atual + deslocamento,
                    tipo : 'emissao_' + tipo,
                    ['deslocamento_em_emissao_' + tipo] : deslocamento,
                    pos_y_final : linha_atual

                })
            );

            // agora o resto

            linha_atual = ultima_linha + 1;
            const qde_por_linha = vis.params.calculados.qde_por_linha;

            for (let i = 1; i <= qde_elementos_restantes; i++) {

                const novo_elemento = {

                    pos_x : ( (i - 1) % qde_por_linha ) + 1,
                    //pos_y : linha_atual,
                    pos_y : linha_atual + deslocamento,
                    tipo : 'emissao_' + tipo,
                    ['deslocamento_em_emissao_' + tipo] : deslocamento,  
                    pos_y_final : linha_atual

                }

                // para usar na posição da setinha do saldo final
                if (tipo == 'vazamento' & i == qde_elementos_restantes) {

                    vis.params.calculados.linha_final_estoque_final = linha_atual

                }
                ///// 


                if ( i % qde_por_linha == 0 ) {

                    linha_atual++

                }

                vetor_emissao.push(novo_elemento);

            }

            vis.data.vetores['emissao_' + tipo] = vetor_emissao;

            // atualiza vetor todos

            vis.data.vetores.todos.push(...vetor_emissao);


            //console.log("ultimos elementos ", elementos_da_ultima_linha);
            //console.log("posicoes a preencher ", posicoes_a_preencher);
            //console.log('ultima linha emissao', ultima_linha_emissao, 'deslocamento', deslocamento);
            //console.log('vetor emissão', vetor_emissao);
        
        },

        recalcula_pos_x_ultima_linha_emissoes_refin : function() {

            const ultima_linha_fantasmas_refin = vis.data.vetores.fantasmas_refin.slice(-1)[0].pos_y;

            // vamos iterar nos fantasmas, de cima para baixo, até encontrar a última linha completamente preenchida

            let pos_y_atual = ultima_linha_fantasmas_refin;

            const posicoes_x = vis.data.vetores.fantasmas_refin
                                 .filter(d => d.pos_y == ultima_linha_fantasmas_refin)
                                 .map(d => d.pos_x);

            const ultima_linha_emissao_refin = vis.data.vetores.todos.filter(d => d.tipo == "emissao_refin").slice(-1)[0].pos_y;

            // pega índices dos elementos que correspondem ao filtro:

            const indexes = vis.data.vetores.todos
                              .filter(d => d.tipo == 'emissao_refin' & d.pos_y == ultima_linha_emissao_refin)
                              .map(d => vis.data.vetores.todos.indexOf(d));

            // para cada índice, acessa o vetor original e substitui o valor de pos_x

            indexes.forEach((d,i) => {

                //console.log("Posicao x antiga: ", vis.data.vetores.todos[d].pos_x, ", Posicao nova: ", posicoes_x[i]);

                vis.data.vetores.todos[d].pos_x = posicoes_x[i];

            })

        }

    },

    render : {

        components : {

            scales : {

                x : function(pos_x) {

                    const x = (pos_x - 1) * (vis.params.calculados.tamanho + vis.params.iniciais.margem) + vis.params.iniciais.margem;

                    //console.log(pos_x, x);

                    return x

                },

                y : function(pos_y) {

                    const y = vis.dims.tetris.h - (pos_y) * (vis.params.calculados.tamanho + vis.params.iniciais.margem);

                    //console.log(pos_y, y)

                    return y

                }

            }

        },

        cria_divs : function(nome, visivel = 1, tipo_pos_y = 'pos_y') {

            const cont = document.querySelector(vis.refs.container);

            // "data binding"

            vis.data.vetores[nome].forEach(d => {

                const new_div = document.createElement("div");

                const props = Object.keys(d);

                props.forEach(property => {

                    new_div.dataset[property] = d[property]

                })

                new_div.dataset.tipo = d.tipo;

                new_div.style.height = vis.params.calculados.tamanho + "px";
                new_div.style.width  = vis.params.calculados.tamanho + "px";
                new_div.style.top    = vis.render.components.scales.y(d[tipo_pos_y]) + "px";
                new_div.style.left   = vis.render.components.scales.x(d.pos_x) + "px";
                new_div.style.opacity = visivel;

                new_div.classList.add("quadradinho");

                cont.appendChild(new_div);

            });

        },

        pagamento_refin : function() {

            let pgtos_refin = document.querySelectorAll('[data-tipo="juros_refin"], [data-tipo="vencimentos_refin"]');

            pgtos_refin.forEach(el => el.classList.add('fantasma'));

        }

    },

    utils : {

        gera_posicoes_linha_completa : function() {


            const qde_elementos_linha = vis.params.calculados.qde_por_linha;
            const pos = vis.params.calculados.posicoes_linha_completa;

            for (let i = 1; i <= qde_elementos_linha; i++) {

                pos.push(i);

            }

        },

        calcula_qde_linhas : function(dimensao) {

            return Math.floor((dimensao - vis.params.iniciais.margem) / (vis.params.calculados.tamanho + vis.params.iniciais.margem))

        },

        // para usar nas animações

        get_data : {

            // preciso meso de todas as funções. descobrir depois como fazer para passar um argumento adicional la dentro do gsap.to() -- o argumento adicional seria o seletor correspondente.

            vencimentos_outras_fontes : function(i, target) {

                // os deslocamentos estão em quantidade de llinhas. precisamos multiplicar pelo tamanho efetivo de uma linha: tamanhado do quadrado + margem.

                return +target.dataset['deslocamento_em_pagamento_vencimentos_outras'] * (vis.params.calculados.tamanho + vis.params.iniciais.margem);

            },

            juros_outras_fontes : function(i, target) {

                return +target.dataset['deslocamento_em_pagamento_juros_outras'] * (vis.params.calculados.tamanho + vis.params.iniciais.margem);

            },

            emissao_refin : function(i, target)  {

                return +target.dataset['deslocamento_em_emissao_refin'] * (vis.params.calculados.tamanho + vis.params.iniciais.margem);

            },

            emissao_vazamento : function(i, target) {

                return +target.dataset['deslocamento_em_emissao_vazamento'] * (vis.params.calculados.tamanho + vis.params.iniciais.margem);


            }

        }

    },

    control : {

        state : {

            ultima_linha : null,

        },

        init : function() {

            gsap.registerPlugin(ScrollTrigger);

            const valor = vis.data.infos.pib;
            // dimensiona container para ficar equivalente ao tamanho do pib

            //vis.control.monitora_botoes();

            vis.params.colors.popula();
            vis.textos_automaticos.populate();

            vis.sizing.pega_tamanho_tetris();
            vis.grid.calcula_parametros(valor); 
            vis.sizing.calcula_dimensoes_necessarias(valor);
            vis.sizing.redimensiona_container();

            vis.data.gera_datasets();
            vis.utils.gera_posicoes_linha_completa();

            vis.grid.calcula_posicao_apos_pagtos();
            vis.grid.calcula_fantasmas();
            vis.grid.calcula_emissoes("refin");

            // não vamos mais fazer isso.
            // vis.grid.recalcula_pos_x_ultima_linha_emissoes_refin();

            vis.grid.calcula_emissoes("vazamento");

            vis.render.cria_divs("todos", visivel = 0);
            vis.render.cria_divs("fantasmas_refin", visivel = 0); // criando depois para ficarem na frente

            console.log(vis.data.vetores.estoque_inicial[0].pos_y);

        },

        /*monitora_botoes : function() {

            const btns = document.querySelectorAll(vis.refs.buttons);

            btns.forEach(btn => btn.addEventListener("click", function(e) {
                //console.log(e.target, e.target.dataset.next)

                if (e.target.classList.contains('back')) {

                    const step = e.target.dataset.previous;
                    anims[step].reverse();

                } else {

                    const step = e.target.dataset.next;
                    anims[step].play();

                }

            }))




        }*/

    }

}

vis.control.init();

const anims = {

    estoque_inicial : {
            
        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="estoque inicial"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }
            
        })
                    .to(vis.refs.container, {
                        opacity : 1,
                        duration: 1
                    })
                    .to('.arrow-start', {
                        opacity : 0
                    }, '<')
                    .to(vis.refs.estoque, {
                        scale: 1,
                        opacity: 1,
                        stagger: {
                        grid: [
                            vis.params.calculados.qde_por_linha,
                            vis.params.calculados.qde_linhas_estoque_inicial
                        ],//"auto",
                        from: "random",
                        axis: "both",
                        each: 0.02
                        }
                    })
                    .to(vis.refs.setinha_saldo_anterior, {
                        top: vis.render.components.scales.y(vis.params.calculados.qde_linhas_estoque_inicial)

                    }, '<')

    },

    juros : {

        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="juros"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }

        })
                     .to(vis.refs.juros, {
                        scale: 1,
                        opacity: 1,
                        ease: Back.easeOut,
                        stagger: {
                            grid: "auto",
                            from: "start",
                            axis: "y",
                            amount: 1
                        }
                     })

    },

    vencimentos : {

        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="vencimentos"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }

        })
                     .to(vis.refs.vencimentos, {
                         backgroundColor : vis.params.colors.orange,
                         stagger: {
                            grid: "auto",
                            from: "start",
                            axis: "y",
                            each: 0.1
                            }
                     })

    },

    vencimentos_outras_fontes : {

        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="vencimentos_outras_fontes"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }

        })
                    .to(vis.refs.vencimentos_outras_fontes, {
                        backgroundColor: vis.params.colors.orangesemi,
                        ease: Back.easeOut,
                        stagger: {
                        grid: "auto",
                        from: "start",
                        //axis: "y",
                        each: 0.05
                    }
                    })
                    .to(vis.refs.vencimentos_outras_fontes, {
                    scale : 0
                    })
                    .to(vis.refs.deslocar_vencimentos, {
                    ease: SteppedEase.config(6),
                    y : vis.utils.get_data.vencimentos_outras_fontes
                    })

    },

    juros_outras_fontes : {

        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="juros_outras_fontes"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }


        })
                     .to(vis.refs.juros_outras_fontes, {
                         backgroundColor: vis.params.colors.blue,
                         ease: Back.easeOut,
                         stagger: {
                            grid: "auto",
                            from: "start",
                            //axis: "y",
                            each: 0.05
                        }
                     })
                     .to(vis.refs.juros_outras_fontes, {
                        ease: Back.easeOut,
                         scale : 0
                     })
                     .to(vis.refs.deslocar_juros, {
                         ease: SteppedEase.config(6),
                         y : vis.utils.get_data.juros_outras_fontes
                     })

    },

    emissao_refin : {

        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="emissao_refin"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }

        })
                     .set(vis.refs.emissao_refin, {
                         scale : 1,
                         opacity : 0,
                         backgroundColor : vis.params.colors.red
                     })
                     .set(vis.refs.fantasmas_refin, {
                        scale : 1,
                        opacity : 0
                    })                     
                     .to(vis.refs.emissao_refin, {
                         opacity: 1
                     })
                     .to(vis.refs.pagamentos_refin, {
                        duration : 1,
                        ease: Back.easeIn,
                        scale : 0
                     })
                     .to(vis.refs.fantasmas_refin, {
                        opacity : 1
                      }, "<")   
                     .to(vis.refs.emissao_refin, {
                         ease: SteppedEase.config(12),
                         duration: 1.5,
                         y : vis.utils.get_data.emissao_refin
                     })
                     .to(vis.refs.fantasmas_refin, {
                        opacity : 0
                     })

    },

    emissao_vazamento : {

        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="emissao_vazamento"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }

        })
                     .set(vis.refs.emissao_vazamento, {
                         scale : 1,
                         opacity : 0,
                         backgroundColor : vis.params.colors.purple
                     })
                     .to(vis.refs.emissao_vazamento, {
                         opacity: 1
                     })
                     .to(vis.refs.emissao_vazamento, {
                         ease: SteppedEase.config(12),
                         duration: 1.5,
                         y : vis.utils.get_data.emissao_vazamento
                     })

    },

    incorpora : {
                
        tl : new gsap.timeline({

            scrollTrigger: {
                trigger: '[data-step="incorpora"]',
                markers: false,
                pin: false,   // pin the trigger element while active
                start: "top bottom", // when the top of the trigger hits the top of the viewport
                end: "80% bottom", // end after scrolling 500px beyond the start
                scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            }

        })
                    .to("[data-tipo='emissao_refin'], [data-tipo='emissao_vazamento']", {
                        backgroundColor: vis.params.colors.yellow,
                        stagger: {
                            grid: "auto",
                            from: "edges",
                            axis: "both",
                            each: 0.04
                        }
                    })
                    .to(vis.refs.setinha_saldo_final, {
                        top: vis.render.components.scales.y(vis.params.calculados.linha_final_estoque_final)

                    }, '<')

    }

}