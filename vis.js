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
            ultimo_elemento : null // estoque + juros

        },

    },

    refs : {

        svg : "svg",
        container : ".svg-container",
        buttons : ".back, .next",
        estoque : "[data-tipo='estoque_inicial'], [data-tipo='vencimentos_outras_fontes'], [data-tipo='vencimentos_refin']",
        juros : "[data-tipo='juros_outras_fontes'], [data-tipo='juros_refin']",
        juros_refin : "[data-tipo='juros_refin']",
        vencimentos : "[data-tipo='vencimentos_outras_fontes'], [data-tipo='vencimentos_refin']"
    
    },

    selections : {

        svg : null,
        container : null,
        rects_divida : null,
        rects_ultima_emissao : null

    },

    dims : {

        svg : {

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

                refin : 210,//209,
                com_outras  : 200,//197,
                total       : 410//406

            },

            vencimentos : {

                refin :  780,//773,
                com_outras  :  400, //394,
                total       : 1180//1167

            },

            vazamento : {

                resultado_bacen :  30,
                outras_despesas : 737,
                total : 767

            },

            outras_fontes : 591,

            emissoes : {

                refin : {

                    principal : 773,
                    juros     : 209

                },

                vazamento : 767

            },

            estoque : {

                inicial : 4250,//4249,
                final   : 5010

            },

            pib: 7.4e12

        },

        marcadores : {

            excluir : ["vencimentos_outras_fontes", "juros_outras_fontes"],

            deslocar_2x : ["vencimentos_refin", "juros_outras_fontes", "juros_refin"],

            desloca_1x : ["juros_refin"]

        },

        vetores : {

            // formato elementos : { posx, posy, indice, tipo }

            estoque_inicial : null,
            juros_outras_fontes : null,
            juros_refin : null,
            vencimentos_outras_fontes : null,
            vencimentos_refin : null,

            vazamento : null,

            grid_refin : null,

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

            // grid juros e vencimentos refinanciados
            const ultimo_indice_estoque_sem_pgtos = vis.data.vetores.estoque_inicial.length;

            vis.data.cria_dataset(
                (vis.data.infos.juros.refin + vis.data.infos.vencimentos.refin) * 1e9, 
                tipo = "grid_refin",
                posicao_inicial = ultimo_indice_estoque_sem_pgtos);

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

    sizing : {

        helpers : {

            tamanho_necessario : function(qde_na_dimensao) {

                return (qde_na_dimensao * (vis.params.calculados.tamanho + vis.params.iniciais.margem) + vis.params.iniciais.margem);
    
            }

        },

        pega_tamanho_svg : function() {

            const height = +d3.select("svg").style("height").slice(0,-2);

            // document.querySelector("svg").getBoundingClientRect().height
            const width  = +d3.select("svg").style("width").slice(0,-2);

            vis.dims.svg.h = height;
            vis.dims.svg.w = width;

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
                (vis.dims.svg.h - margem) * 
                (vis.dims.svg.w - margem) ) / qde_unidades;

            const dim_unitaria = Math.sqrt(area_unitaria);
            
            const lado = Math.round(dim_unitaria - margem);

            const qde_por_linha = Math.ceil((vis.dims.svg.w - vis.params.iniciais.margem) / dim_unitaria);

            const qde_linhas = Math.ceil((vis.dims.svg.h - vis.params.iniciais.margem) / dim_unitaria);

            vis.params.calculados.tamanho = lado;
            vis.params.calculados.qde_por_linha = qde_por_linha;
            vis.params.calculados.ultima_linha = qde_linhas;

            // em seguida, calcula parametros para redimensionamento
        },

        registra_emissao : function(valor) {

            const qde_por_linha = vis.params.calculados.qde_por_linha;

            const qde_unidades = Math.round(valor/vis.params.iniciais.valor_unidade);
            console.log("Para esta emissão de ", valor, ", precisaremos de ", qde_unidades, " quadradinhos.");

            // dados da última linha preenchida do estoque

            const ultimo_elemento_atual = vis.data.divida.slice(-1)[0];
            const ultima_linha_atual = ultimo_elemento_atual.pos_y;
            const indice_ultimo_elemento_estoque = ultimo_elemento_atual.unidade;

            console.log("o ultimo elemento está em ", ultimo_elemento_atual);

            // lista dos elementos dessa última linha atual

            const elementos_da_ultima_linha = vis.data.divida.filter(d => d.pos_y == ultima_linha_atual);
            const qde_elementos_ultima_linha = elementos_da_ultima_linha.length;
            const posicoes_ultima_linha = elementos_da_ultima_linha.map(d => d.pos_x);

            console.log("A última linha do estoque atualmente tem ", qde_elementos_ultima_linha);

            // avalia o lado por onde começar a completar

            const lado_a_completar = posicoes_ultima_linha.includes(1) ?
                "direita" :
                "esquerda";

            console.log(lado_a_completar);

            const posicoes_linha_completa = vis.params.calculados.posicoes_linha_completa;

            // faz a diferença da linha completa para a última linha

            const posicoes_vazias_ultima_linha = posicoes_linha_completa.filter(
                
                d => !posicoes_ultima_linha.includes(d)

            );

            const qde_posicoes_vazias = posicoes_vazias_ultima_linha.length;
            const qde_a_completar = 
              (qde_unidades > qde_posicoes_vazias) ? 
              qde_posicoes_vazias : 
              qde_unidades;

            // o conjunto de elementos da emissão vai ter, em geral: 
            // * uma linha com os elementos que faltam ser preenchidos na última linha atual
            // * n linhas completas
            // * uma linha incompleta com os elementos remanescentes

            const qde_linhas_completas = 
              qde_unidades > qde_posicoes_vazias ?
              Math.floor((qde_unidades - qde_posicoes_vazias)/qde_por_linha) :
              0;

            const qde_elementos_remanescentes = (qde_unidades - qde_a_completar) % qde_por_linha;

            // resumo da Ópera

            const tem_posicoes_a_completar = qde_a_completar > 0;
            const tem_linhas_completas = qde_linhas_completas > 0;
            const tem_elementos_remanescentes = qde_elementos_remanescentes > 0;

            console.log( "\n",
                "Tem posicoes a completar? ", tem_posicoes_a_completar, qde_a_completar,"\n",
                "Tem linhas completas? ", tem_linhas_completas, qde_linhas_completas, "\n",
                "Tem elementos remanescentes? ", tem_elementos_remanescentes, qde_elementos_remanescentes
            );

            const qde_linhas_emissao = 
              tem_posicoes_a_completar + // convertido para 0 ou 1
              qde_linhas_completas + 
              tem_elementos_remanescentes; // convertido para 0 ou 1

            console.log("A emissão vai ter ", qde_linhas_emissao, " linhas.")

            // ultima linha possivel no grid

            const ultima_linha_possivel_grid = vis.utils.calcula_qde_linhas(vis.dims.svg.h);//vis.dims.altura_necessaria);

            console.log("Ultima linha possível", ultima_linha_possivel_grid);
            // primeira linha a ser preenchida na emissão, de baixo para cima

            const nro_primeira_linha_emissao = ultima_linha_possivel_grid - qde_linhas_emissao + 1;

            console.log("Primeira linha emissão", nro_primeira_linha_emissao);

            // vamos montar o novo dataset

            const dataset_emissao = [];

            let linha_atual = nro_primeira_linha_emissao;
            let indice_atual = indice_ultimo_elemento_estoque + 1;

            // primeiro as posições a completar na última linha do estoque

            if (tem_posicoes_a_completar) {

                const ajuste_lado =  
                  lado_a_completar == "esquerda" ?
                  0 : 
                  qde_elementos_ultima_linha;

                for (let i = 1; i <= qde_a_completar; i++) {

                    const elem = {

                        unidade : indice_atual,
                        pos_x : i + ajuste_lado,
                        pos_y : linha_atual,

                    }

                    dataset_emissao.push(elem);

                    indice_atual++;

                }

                linha_atual++;

            }

            // agora vamos para as linhas completas, se houver

            if (tem_linhas_completas) {

                //const ultima_linha_completa = linha_atual + qde_linhas_completas - 1;

                //while (linha_atual <= ultima_linha_completa) {

                //}

                const qde_unidades_em_linhas_completas = qde_linhas_completas * qde_por_linha;

                for (let i = 1; i <= qde_unidades_em_linhas_completas; i++) {
    
                    const elem = {
    
                        unidade : indice_atual,
                        pos_x : ( (i - 1) % qde_por_linha ) + 1,
                        pos_y : linha_atual
    
                    }
    
                    if ( i % qde_por_linha == 0 ) {
    
                        linha_atual++
    
                    }
    
                    indice_atual ++
    
                    dataset_emissao.push(elem);
    
                }  

            }

            // por fim, os elementos remanescentes, se houver

            if (tem_elementos_remanescentes) {

                const ajuste_lado =  
                  lado_a_completar == "esquerda" ?
                  0 : 
                  qde_por_linha - qde_elementos_remanescentes;

                for (let i = 1; i <= qde_elementos_remanescentes; i++) {

                    const elem = {

                        unidade : indice_atual,
                        pos_x : i + ajuste_lado,
                        pos_y : linha_atual,

                    }

                    dataset_emissao.push(elem);

                    indice_atual++;

                }

            }

            console.log("Dados emissão: ", dataset_emissao);

            console.log("Diferença de linhas", );

            const deslocamento_necessario = nro_primeira_linha_emissao - ultima_linha_atual - 1 + tem_posicoes_a_completar; // se tiver posicoes a completar, tem que deslocar mais um


            // refatorar isso

            // fazer funções de renderização separadas?

            const svg = d3.select(vis.refs.svg);


            vis.selections.rects_ultima_emissao = 
            svg
              .selectAll("rect.emissao")
              .data(dataset_emissao)
              .join("rect")
              .classed("emissao", true)
              .attr("y", d => vis.render.components.scales.y(d.pos_y))
              .attr("x", d => vis.render.components.scales.x(d.pos_x))
              .attr("width", vis.params.calculados.tamanho)
              .attr("height", vis.params.calculados.tamanho)
              .attr("fill", "red");

            vis.selections.rects_ultima_emissao  
              .transition()
              .duration(1000)
              .attr("opacity", 1);

            // move para o estoque principal e atualiza as posições.

            vis.selections.rects_ultima_emissao
              .transition()
              .ease(d3.easeLinear)
              .delay(1000)
              .duration(deslocamento_necessario * 100)
              .attr("y", d => {
                  const nova_pos_y = d.pos_y - deslocamento_necessario;
                  d.pos_y = nova_pos_y;
                  return vis.render.components.scales.y(d.pos_y)
              });

            vis.selections.rects_ultima_emissao
              .transition()
              .delay(1000 + 1000 + deslocamento_necessario * 100)
              .duration(500)
              .attr("fill", "goldenrod");

            vis.data.divida.push(...dataset_emissao);

            vis.selections.rects_ultima_emissao
              .classed("emissao", false)
              .classed("estoque", true);

            // atualiza seleção

            vis.selections.rects_divida = svg.selectAll("rect.estoque")
              .data(vis.data.divida);

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
    
                console.log("Para este pagamento de ", valor, ", apagaremos ", qde_unidades, " quadradinhos, a partir do indice ", posicao_inicial, ", até a posição ", posicao_final)  ;
    
                // linhas
    
                const linha_primeiro = vis.grid.helpers.pega_coordenadas(posicao_inicial).pos_y;
                const linha_ultimo   = vis.grid.helpers.pega_coordenadas(posicao_final).pos_y;
    
                console.log("temos que apagar ", linha_ultimo - linha_primeiro - 1, "linhas completas: da linha", linha_primeiro, "até a :", linha_ultimo);
    
                // elementos a remover
    
                elementos_a_remover[tipo] = vis.data.vetores.todos.filter(d => d.indice_geral <= posicao_final & d.indice_geral >= posicao_inicial);

                console.log("Elementos a remover, para o tipo ", tipo, ": ", elementos_a_remover[tipo]);
    
                // // elementos afetados
    
                // elementos_afetados[tipo] = vis.data.vetores.todos.filter(d => d.indice_geral > posicao_final);
    
    
                deslocamentos[tipo] = Array(vis.params.calculados.qde_por_linha + 1).fill(0)
    
                elementos_a_remover[tipo].forEach(d => {
    
                    deslocamentos[tipo][d.pos_x] += 1
    
                });

            }

            console.log({posicoes_finais});

            // junta os elementos_a_remover

            const a_remover = [
                ...elementos_a_remover["juros"],
                ...elementos_a_remover["vencimentos"]
            ];

            console.log(a_remover, elementos_a_remover["juros"], elementos_a_remover["vencimentos"]);

            //console.log("Deslocamentos", deslocamentos);

            vis.data.vetores.todos.forEach(d => {

                if ( a_remover.includes(d) ) {

                    d["remover"] = true;

                } else {

                    if (d.indice_geral > posicoes_finais["juros"]) {

                        d["deslocar_juros"] = true;

                        d["proximo_pos_y_juros"] = d.pos_y - deslocamentos.juros[d.pos_x] - deslocamentos.vencimentos[d.pos_x]
                        // a posicao final dos juros, que estão em cima dos quadradinhos dos vencimentos, precisa ser complementada pelos deslocamentos dos vencimentos.
                    }
                    
                    if (d.indice_geral > posicoes_finais["vencimentos"]) {

                        d["deslocar_vencimentos"] = true;

                        d["proximo_pos_y_vencimentos"] = d.pos_y - deslocamentos.vencimentos[d.pos_x]

                    }

                }

            });

        },

        calcula_emissoes : function(tipo) {

            // tipo = "refin" ou "vazamento"

            let valor;

            if (tipo == "refin") {

                valor = (
                    vis.data.infos.emissoes.refin.principal + 
                    vis.data.infos.emissoes.refin.juros ) * 1e9;

                    console.log("em refin, valor : ", valor)

            } else {

                valor = vis.data.infos.emissoes[tipo]*1e9;

            }

            

            const qde = vis.grid.helpers.calcula_qde_unidades(valor);

            console.log("Vamos emitir ", qde);

            // qual a última linha atual?

            const ultimo = vis.data.vetores.todos.slice(-1)[0];
            const ultima_linha = ultimo.pos_y//proximo_pos_y_juros;

            // posicoes dessa ultima linha

            const elementos_da_ultima_linha = vis.data.vetores.todos.filter(d => d.pos_y == ultima_linha);

            const posicoes_elementos_ultima_linha = elementos_da_ultima_linha.map(d => d.pos_x);

            // posicoes de uma linha completa

            const posicoes_linha_completa = vis.params.calculados.posicoes_linha_completa;

            // é preciso preencher a última linha?

            const posicoes_a_preencher = posicoes_linha_completa
              .filter(d => !posicoes_elementos_ultima_linha.includes(d));

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

            let vetor_emissao = posicoes_a_preencher.map(x => (
                {
                    pos_x : x,
                    pos_y : ultima_linha,
                    tipo : 'emissao_' + tipo,
                    pos_y_emissao : ultima_linha + deslocamento

                })
            );

            // agora o resto

            linha_atual = ultima_linha + 1;
            const qde_por_linha = vis.params.calculados.qde_por_linha;

            for (let i = 1; i <= qde_elementos_restantes; i++) {

                const novo_elemento = {

                    pos_x : ( (i - 1) % qde_por_linha ) + 1,
                    pos_y : linha_atual,
                    tipo : 'emissao_' + tipo,
                    pos_y_emissao : linha_atual + deslocamento

                }

                if ( i % qde_por_linha == 0 ) {

                    linha_atual++

                }

                vetor_emissao.push(novo_elemento);

            }

            vis.data.vetores['emissao_' + tipo] = vetor_emissao;

            // atualiza vetor todos

            vis.data.vetores.todos = [...vis.data.vetores.todos, ...vetor_emissao];


            console.log("ultimos elementos ", elementos_da_ultima_linha);
            console.log("posicoes a preencher ", posicoes_a_preencher);
            console.log('ultima linha emissao', ultima_linha_emissao, 'deslocamento', deslocamento);
            console.log('vetor emissão', vetor_emissao);

            // document.querySelectorAll(vis.refs.juros_refin)
            //   .forEach(el => {
            //       if (el.dataset.proximo_pos_y_juros == ultima_linha) {
            //         el.style.backgroundColor = "coral"
            //       }   
            //   });

            // talvez aqui tenha que testar se a linha inferior tb está incompleta

                

        
        },



        registra_pagamento : function(valor, posicao_inicial) {

            const qde_unidades = Math.round(valor/vis.params.iniciais.valor_unidade);

            console.log("Para este pagamento de ", valor, ", apagaremos ", qde_unidades, " quadradinhos.");

            // acha o index do elemento inicial no dataset

            const index_primeiro = vis.data.divida
              .map(elemento => elemento.unidade)
              .indexOf(posicao_inicial)
            ;

            // linha do primeiro a ser removido
            const linha_primeiro = vis.data.divida[index_primeiro].pos_y;
            const qde_linhas_completas = Math.floor(qde_unidades / vis.params.calculados.qde_por_linha);
            const nro_linha_incompleta = linha_primeiro + qde_linhas_completas;
            const primeira_posicao_da_linha_incompleta = qde_unidades % vis.params.calculados.qde_por_linha;
            

            console.log(primeira_posicao_da_linha_incompleta, qde_linhas_completas);

            let vetor_deslocamento = [];

            for (let i = 0; i <= vis.params.calculados.qde_por_linha - 1; i++) {

                if (i >= primeira_posicao_da_linha_incompleta) {
                    vetor_deslocamento[i] = qde_linhas_completas;
                } else {
                    vetor_deslocamento[i] = qde_linhas_completas + 1
                }

            }

            console.log(vetor_deslocamento);

            const elementos_removidos = vis.data.divida.splice(index_primeiro, qde_unidades);

            console.log("Foram removidos, a partir do index ", index_primeiro, ": ", elementos_removidos);


            // atualiza data join

            vis.selections.rects_divida = vis.selections.rects_divida
              .data(vis.data.divida, d => d.unidade);

            // remove rects pagos

            vis.selections.rects_divida
              .exit()
              .classed("estoque", false) // para a transicao funcionar (estoque define a cor com style)
              .attr("fill", "goldenrod")  // mesma coisa
              .attr("opacity", 1)     // mesma coisa
              .transition()
              .duration(1000)
              .attr("fill", "blue")
              .attr("stroke", "blue")
              .attr("stroke-width", 3)
              .transition()
              .delay(1000)
              .duration(1000)
              .attr("opacity", 0)
              .remove()
            ;

            // desloca

            vis.selections.rects_divida
              .filter(datum => datum.pos_y >= nro_linha_incompleta)
              .transition()
              .delay(2500)
              .transition(1000)
              .attr("y", function(d) {
                  const nova_pos_y = d.pos_y - vetor_deslocamento[d.pos_x - 1];
                  d.pos_y = nova_pos_y;
                  return vis.render.components.scales.y(nova_pos_y)
              });

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

                    const y = vis.dims.svg.h - (pos_y) * (vis.params.calculados.tamanho + vis.params.iniciais.margem);

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

        remove : function() {

            let remove = document.querySelectorAll('[data-remover="true"]');

            remove.forEach(
                d => d.style.opacity = 0
            );

        },

        desloca : function(tipo) {

            let desloca = document.querySelectorAll('[data-deslocar_' + tipo + '="true"]');

            desloca.forEach(d =>
                d.style.top = vis.render.components.scales.y(d.dataset["proximo_pos_y_" + tipo]) + "px"
            );

            // atualiza vetores

            vis.data.vetores.todos.forEach(quadradinho => 
                quadradinho.pos_y = quadradinho["proximo_pos_y_" + tipo]);

        },

        desloca_emissao : function(tipo) {

            let desloca = document.querySelectorAll('[data-tipo="emissao_"' + tipo + '"]');

            desloca.forEach(el => 
                el.style.top = vis.render.components.scales.y(el.dataset.pos_y_emissao) + 'px'
                );

        },

        desenhas_rects : function() {

            const svg = d3.select(vis.refs.svg);

            vis.selections.rects_divida = svg
              .selectAll("rect")
              .data(vis.data.divida, d => d.unidade)
              .join("rect")
              .classed("estoque", true)
              .attr("data-unidade", d => d.unidade)
              .attr("x", d => vis.render.components.scales.x(d.pos_x) + vis.params.calculados.tamanho/2)
              .attr("y", d => vis.render.components.scales.y(d.pos_y) + vis.params.calculados.tamanho/2)
              .attr("width", 0)
              .attr("height", 0);

            vis.selections.rects_divida
              .transition()
              .duration(100)
              .delay((d,i) => d.pos_x * 10 + d.pos_y * 50)
              .attr("x", d => vis.render.components.scales.x(d.pos_x))
              .attr("y", d => vis.render.components.scales.y(d.pos_y))
              .attr("width", vis.params.calculados.tamanho)
              .attr("height", vis.params.calculados.tamanho);

        }
    },

    stepper : {

        "estoque inicial" : function() {

            document.querySelectorAll(vis.refs.estoque).forEach(quadradinho =>
                quadradinho.style.opacity = 1);

            

            //vis.render.cria_divs("estoque_inicial");
            //vis.render.cria_divs("vencimentos_outras_fontes");
            //vis.render.cria_divs("vencimentos_refin");

        },

        "juros" : function() {

            document.querySelectorAll(vis.refs.juros).forEach(quadradinho =>
                quadradinho.style.opacity = 1);

            //vis.render.cria_divs("juros_outras_fontes");
            //vis.render.cria_divs("juros_refin");

        },

        "vencimentos" : function() {

            document.querySelectorAll(vis.refs.vencimentos).forEach(quadradinho =>
                quadradinho.style.opacity = 1);

            vis.render.remove();

        },

        "pagamentos-vencimentos" : function() {

            vis.render.remove();
            vis.render.desloca("vencimentos");

        },

        "pagamentos-juros" : function() {

            vis.render.remove();
            vis.render.desloca("juros");

        },

        "emissoes" : function() {

            vis.grid.calcula_emissoes("refin");
            vis.render.cria_divs('emissao_refin', visivel = 1, tipo_pos_y = 'pos_y_emissoes');

        },

        "emissoes-vazamento" : function() {

            vis.render.desloca_emissao('refin');
            vis.grid.calcula_emissoes("vazamento");
            vis.render.cria_divs('emissao_vazamento', visivel = 1, tipo_pos_y = 'pos_y_emissoes');

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

        }

    },

    control : {

        state : {

            ultima_linha : null,

        },

        init : function() {

            const valor = vis.data.infos.pib;
            // dimensiona container para ficar equivalente ao tamanho do pib

            vis.control.monitora_botoes();

            vis.sizing.pega_tamanho_svg();
            vis.grid.calcula_parametros(valor); 
            vis.sizing.calcula_dimensoes_necessarias(valor);
            vis.sizing.redimensiona_container();

            vis.data.gera_datasets();
            vis.grid.calcula_posicao_apos_pagtos();
            vis.utils.gera_posicoes_linha_completa();
            vis.render.cria_divs("todos", visivel = 0);

        },

        monitora_botoes : function() {

            const btns = document.querySelectorAll(vis.refs.buttons);

            btns.forEach(btn => btn.addEventListener("click", function(e) {
                console.log(e.target, e.target.dataset.next)

                vis.stepper[e.target.dataset.next]();

            }))




        }

    }

}

vis.control.init();