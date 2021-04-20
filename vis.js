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
            posicoes_linha_completa : []

        },

    },

    refs : {

        svg : "svg",
        container : ".svg-container",
        buttons : ".back, .next"
    
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

        vetores : {

            // formato elementos : { posx, posy, indice, tipo }

            estoque_inicial : null,
            juros_outras_fontes : null,
            juros_refin : null,
            vencimentos_outras_fontes : null,
            vencimentos_refin : null,
            vazamento : null,
            grid_refin: null

        },

        divida : [],

        cria_dataset : function(valor, posicao_inicial = 0) {

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
                    pos_y : Math.floor( (indice - 1) / vis.params.calculados.qde_por_linha ) + 1

                }

            }

            vis.grid.ultima_posicao.set();

            return dataset;

        },

        gera_datasets : function() {

            vis.data.divida = vis.data.cria_dataset(vis.data.infos.estoque.inicial * 1e9);

            // estoque inicial sem pagamentos
            vis.data.vetores.estoque_inicial = vis.data.cria_dataset(
                (vis.data.infos.estoque.inicial - vis.data.infos.vencimentos.total) * 1e9);

            let ultimo_indice = vis.data.vetores.estoque_inicial.length;

            // pagamentos com outras fontes
            vis.data.vetores.vencimentos_outras_fontes = vis.data.cria_dataset(
                vis.data.infos.vencimentos.com_outras * 1e9, posicao_inicial = ultimo_indice);

            ultimo_indice += vis.data.vetores.vencimentos_outras_fontes.length;

            // pagamentos refinanciamento
            vis.data.vetores.vencimentos_refin = vis.data.cria_dataset(
                vis.data.infos.vencimentos.refin * 1e9, posicao_inicial = ultimo_indice);

            ultimo_indice += vis.data.vetores.vencimentos_refin.length;

            // juros com outras fontes
            vis.data.vetores.juros_outras_fontes = vis.data.cria_dataset(
                vis.data.infos.juros.com_outras * 1e9, posicao_inicial = ultimo_indice);

            ultimo_indice += vis.data.vetores.juros_outras_fontes.length;

            // juros refinanciamento
            vis.data.vetores.juros_refin = vis.data.cria_dataset(
                vis.data.infos.juros.refin * 1e9, posicao_inicial = ultimo_indice);

            ultimo_indice += vis.data.vetores.juros_refin.length;

            // grid juros e vencimentos refinanciados
            const ultimo_indice_estoque_sem_pgtos = vis.data.vetores.estoque_inicial.length;

            vis.data.vetores.grid_refin = vis.data.cria_dataset(
                (vis.data.infos.juros.refin + vis.data.infos.vencimentos.refin) * 1e9, 
                posicao_inicial = ultimo_indice_estoque_sem_pgtos);

        
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

            const cont = d3.select(vis.refs.container);
            const svg = d3.select(vis.refs.svg);

            cont.style("width", vis.dims.largura_necessaria + "px");
            //svg.style("height", vis.dims.altura_necessaria + "px");

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

        cria_divs : function(nome, visivel = 1) {

            const cont = document.querySelector(vis.refs.container);

            vis.data.vetores[nome].forEach(d => {

                const new_div = document.createElement("div");

                const props = Object.keys(d);

                props.forEach(property => {

                    new_div.dataset[property] = d[property]

                })

                new_div.dataset.tipo = nome;

                new_div.style.height = vis.params.calculados.tamanho + "px";
                new_div.style.width  = vis.params.calculados.tamanho + "px";
                new_div.style.top    = vis.render.components.scales.y(d.pos_y) + "px";
                new_div.style.left   = vis.render.components.scales.x(d.pos_x) + "px";
                new_div.style.opacity = visivel;

                new_div.classList.add("quadradinho");

                cont.appendChild(new_div);

            });

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

            vis.render.cria_divs("estoque_inicial");
            vis.render.cria_divs("vencimentos_outras_fontes");
            vis.render.cria_divs("vencimentos_refin");

        },

        "juros" : function() {

            vis.render.cria_divs("juros_outras_fontes");
            vis.render.cria_divs("juros_refin");

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
            vis.utils.gera_posicoes_linha_completa();
            //vis.render.desenhas_rects();

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