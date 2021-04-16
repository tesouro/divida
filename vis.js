const vis = {

    params : {

        unidade : {
            
            valor: +10e9,
            tamanho: null,
            margem: 2,
            qde_por_linha : null

        },

        espaco_inicial: 0,//400,

        posicoes_linha_completa : []

    },

    refs : {

        svg : "svg",
        container : ".svg-container"
    
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
        qde_unidades : null

    },

    data : {

        infos : {

            juros : {

                com_emissao : 209,
                com_outras  : 197,
                total       : 406

            },

            vencimentos : {

                com_emissao :  773,
                com_outras  :  394,
                total       : 1167

            },

            vazamento : {

                resultado_bacen :  30,
                outras_despesas : 737

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

                inicial : 4249,
                final   : 5010

            }

        },

        divida : []

    },

    grid : {

        ultima_posicao : {

            x : null,
            y : null,
            unidade : null,
            index : null

        },

        pega_tamanho_svg : function() {

            const height = +d3.select("svg").style("height").slice(0,-2);
            const width  = +d3.select("svg").style("width").slice(0,-2);

            vis.dims.svg.h = height;
            vis.dims.svg.w = width;

        },

        calcula : function(valor) {

            const margem = vis.params.unidade.margem;

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);

            const area_unitaria = (
                (vis.dims.svg.h - margem) * 
                (vis.dims.svg.w - margem) ) / qde_unidades;

            console.log("area", area_unitaria);

            const dim_unitaria = Math.sqrt(area_unitaria);

            console.log("dim_unitaria", dim_unitaria);
            
            const lado = Math.round(dim_unitaria - margem);

            vis.params.unidade.tamanho = lado;

            const qde_por_linha = Math.ceil((vis.dims.svg.w - vis.params.unidade.margem) / dim_unitaria);

            vis.params.unidade.qde_por_linha = qde_por_linha;

            const qde_linhas = Math.ceil((vis.dims.svg.h - vis.params.unidade.margem) / dim_unitaria);

            console.log(qde_por_linha, qde_linhas);




            //const qde_linhas = Math.floor(qde_unidades / vis.params.unidade.qde_por_linha);

            function dimensao_necessaria(qde_na_dimensao) {

                return (qde_na_dimensao * (vis.params.unidade.tamanho + vis.params.unidade.margem) + vis.params.unidade.margem);

            }

            vis.dims.altura_necessaria  = dimensao_necessaria(qde_linhas) + vis.params.espaco_inicial;
            vis.dims.largura_necessaria = dimensao_necessaria(vis.params.unidade.qde_por_linha);
            vis.dims.qde_unidades       = qde_unidades;

            console.log("Precisaremos de ", qde_unidades, " unidades, ", qde_linhas, " linhas, e uma largura de ", dimensao_necessaria(vis.params.unidade.qde_por_linha), "px e uma altura de ", dimensao_necessaria(qde_linhas), "px.");

        },

        dimensiona_container : function() {

            const cont = d3.select(vis.refs.container);
            const svg = d3.select(vis.refs.svg);

            cont.style("width", vis.dims.largura_necessaria + "px");
            //svg.style("height", vis.dims.altura_necessaria + "px");

        },

        pega_ultima_posicao : function() {

            this.ultima_posicao.x = ( (vis.dims.qde_unidades - 1) % vis.params.unidade.qde_por_linha ) + 1;
            this.ultima_posicao.y = Math.floor( (vis.dims.qde_unidades - 1) / vis.params.unidade.qde_por_linha ) + 1;
            this.ultima_posicao.unidade = vis.dims.qde_unidades;
            this.ultima_posicao.index = vis.dims.qde_unidades - 1;

        },

        cria_dataset : function() {

            for (let unidade = 1; unidade <= vis.dims.qde_unidades; unidade++) {

                vis.data.divida[unidade-1] = {

                    unidade : unidade,
                    pos_x : ( (unidade - 1) % vis.params.unidade.qde_por_linha ) + 1,
                    pos_y : Math.floor( (unidade - 1) / vis.params.unidade.qde_por_linha ) + 1

                }

            }

            this.pega_ultima_posicao();

        },

        registra_emissao : function(valor) {

            const qde_por_linha = vis.params.unidade.qde_por_linha;

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);
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

            const posicoes_linha_completa = vis.params.posicoes_linha_completa;

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
              .attr("y", d => vis.draw.components.scales.y(d.pos_y))
              .attr("x", d => vis.draw.components.scales.x(d.pos_x))
              .attr("width", vis.params.unidade.tamanho)
              .attr("height", vis.params.unidade.tamanho)
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
                  return vis.draw.components.scales.y(d.pos_y)
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

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);

            console.log("Para este pagamento de ", valor, ", apagaremos ", qde_unidades, " quadradinhos.");

            // acha o index do elemento inicial no dataset

            const index_primeiro = vis.data.divida
              .map(elemento => elemento.unidade)
              .indexOf(posicao_inicial)
            ;

            // linha do primeiro a ser removido
            const linha_primeiro = vis.data.divida[index_primeiro].pos_y;
            const qde_linhas_completas = Math.floor(qde_unidades / vis.params.unidade.qde_por_linha);
            const nro_linha_incompleta = linha_primeiro + qde_linhas_completas;
            const primeira_posicao_da_linha_incompleta = qde_unidades % vis.params.unidade.qde_por_linha;
            

            console.log(primeira_posicao_da_linha_incompleta, qde_linhas_completas);

            let vetor_deslocamento = [];

            for (let i = 0; i <= vis.params.unidade.qde_por_linha - 1; i++) {

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
                  return vis.draw.components.scales.y(nova_pos_y)
              });

        }



    },

    draw : {

        components : {

            scales : {

                x : function(pos_x) {

                    const x = (pos_x - 1) * (vis.params.unidade.tamanho + vis.params.unidade.margem) + vis.params.unidade.margem;

                    //console.log(pos_x, x);

                    return x

                },

                y : function(pos_y) {

                    const y = vis.dims.svg.h - (pos_y) * (vis.params.unidade.tamanho + vis.params.unidade.margem);

                    //console.log(pos_y, y)

                    return y

                }


            }

        },

        desenhas_rects : function() {

            const svg = d3.select(vis.refs.svg);

            vis.selections.rects_divida = svg
              .selectAll("rect")
              .data(vis.data.divida, d => d.unidade)
              .join("rect")
              .classed("estoque", true)
              .attr("data-unidade", d => d.unidade)
              .attr("x", d => vis.draw.components.scales.x(d.pos_x))
              .attr("y", d => vis.draw.components.scales.y(d.pos_y))
              .attr("width", vis.params.unidade.tamanho)
              .attr("height", vis.params.unidade.tamanho);

        }
    },

    utils : {

        gera_posicoes_linha_completa : function() {


            const qde_elementos_linha = vis.params.unidade.qde_por_linha;
            const pos = vis.params.posicoes_linha_completa;

            for (let i = 1; i <= qde_elementos_linha; i++) {

                pos.push(i);

            }

        },

        calcula_qde_linhas : function(dimensao) {

            return Math.floor((dimensao - vis.params.unidade.margem) / (vis.params.unidade.tamanho + vis.params.unidade.margem))

        }

    },

    control : {

        state : {

            ultima_linha : null,

        },

        init : function() {

            vis.grid.pega_tamanho_svg();
            vis.grid.calcula(vis.data.infos.estoque.final * 1e9);
            vis.grid.dimensiona_container();
            vis.grid.cria_dataset();
            vis.utils.gera_posicoes_linha_completa();
            vis.draw.desenhas_rects();

        }

    }

}

vis.control.init();