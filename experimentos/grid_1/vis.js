const vis = {

    params : {

        unidade : {
            
            valor: +5e9,
            tamanho: 10,
            margem: 4,
            qde_por_linha : 20

        },

        espaco_inicial: 400,

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

        largura_necessaria : null,
        altura_necessaria : null,
        qde_unidades : null

    },

    data : {

        divida : []

    },

    grid : {

        ultima_posicao : {

            x : null,
            y : null,
            unidade : null,
            index : null

        },

        calcula : function(valor) {

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);
            const qde_linhas = Math.floor(qde_unidades / vis.params.unidade.qde_por_linha);

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
            svg.style("height", vis.dims.altura_necessaria + "px");

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

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);
            console.log("Para esta emissão de ", valor, ", precisaremos de ", qde_unidades, " quadradinhos.");

            const ultimo_elemento = vis.data.divida.slice(-1)[0];
            const nro_ultima_linha = ultimo_elemento.pos_y;
            const indice_ultimo_elemento = ultimo_elemento.unidade;

            console.log("o ultimo elemento está em ", ultimo_elemento.pos_x, ultimo_elemento.pos_y);

            const ultima_linha = vis.data.divida.filter(d => d.pos_y == nro_ultima_linha);
            const proxima_linha = ultima_linha + 1;
            const posicoes_ultima_linha = ultima_linha.map(d => d.pos_x);


            // avalia o lado por onde começar a completar

            const lado_a_completar = posicoes_ultima_linha.includes(1) ?
                "esquerda" :
                "direita"  ;


            console.log("posicoes da ultima linha: ", posicoes_ultima_linha, ", lado a completar: ", lado_a_completar);

            const linha_completa = vis.params.posicoes_linha_completa;

            console.log(linha_completa);

            // faz a diferença da linha completa para a última linha

            const posicoes_vazias = linha_completa.filter(
                
                d => !posicoes_ultima_linha.includes(d)

                );

            const qde_posicoes_vazias = posicoes_vazias.length;

            // quantas linhas serão necessárias

            const linhas_completas = 
              qde_unidades > qde_posicoes_vazias ?
              Math.floor((qde_unidades - qde_posicoes_vazias)/vis.params.unidade.qde_por_linha) :
              0;
            
            console.log("calculo", qde_unidades, qde_posicoes_vazias, linhas_completas)

            const qde_posicoes_ultima_linha_nova = (qde_unidades - qde_posicoes_vazias) % vis.params.unidade.qde_por_linha;

            console.log("Precisamos de ", linhas_completas, " linhas além da linha incompleta. Posições vazias: ", posicoes_vazias, ". Linha final no topo: ", qde_posicoes_ultima_linha_nova);

            // vamos montar o dataset da emissão, de trás para a frente

            const ultima_linha_possivel_grid = vis.utils.calcula_qde_linhas(vis.dims.altura_necessaria);

            let linha = ultima_linha_possivel_grid;
            console.log("ultima linha possivel", linha)
            let unidade_atual = indice_ultimo_elemento + qde_unidades - qde_posicoes_ultima_linha_nova + 1;
            // seria o primeiro da linha

            const dados_emissao = [];
            let posicao_x_atual;

            // vamos começar pela primeira linha incompleta do alto para baixo

            if (qde_posicoes_ultima_linha_nova > 0) {

                const ajuste_lado = 
                  lado_a_completar == "esquerda" ?
                  0 : 
                  vis.params.unidade.qde_por_linha - qde_posicoes_ultima_linha_nova + 1;

                for (let i = 1; i<= qde_posicoes_ultima_linha_nova; i++) {

                    const elem = {

                        pos_x : i + ajuste_lado,
                        pos_y : linha,
                        unidade : unidade_atual,

                    }

                    dados_emissao.push(elem);

                    unidade_atual++
                }

            }

            // agora as linhas completas

            if (linhas_completas > 0) {

                const qde_unidade_linhas_completas = linhas_completas * vis.params.unidade.qde_por_linha;
                const primeira_unidade_linhas_completas = unidade_atual - qde_posicoes_ultima_linha_nova - qde_unidade_linhas_completas;
                
                unidade_atual = primeira_unidade_linhas_completas;
                linha = linha - linhas_completas + 1;
                const primeira_linha_completa = linha;
    
                for (let i = 1; i <= qde_unidade_linhas_completas; i++) {
    
                    const elem = {
    
                        unidade : unidade_atual,
                        pos_x : ( (i - 1) % vis.params.unidade.qde_por_linha ) + 1,
                        pos_y : linha
    
                    }
    
                    if ( i % vis.params.unidade.qde_por_linha == 0 ) {
    
                        linha++
    
                    }
    
                    unidade_atual ++
    
                    dados_emissao.push(elem);
    
                }

            }

            // e agora a linha que completa a última

            if (qde_posicoes_vazias > 0) {

                const ajuste_lado_primeira = 
                lado_a_completar == "esquerda" ?
                0 : 
                vis.params.unidade.qde_por_linha - qde_posicoes_vazias + 1;
  
              unidade_atual = indice_ultimo_elemento + 1;
              linha = linha-1;
  
              for (let i = 1; i <= qde_posicoes_vazias; i++) {
  
                  const elem = {
  
                      pos_x : i + ajuste_lado_primeira,
                      pos_y : linha,
                      unidade : unidade_atual,
  
                  }
  
                  dados_emissao.push(elem);
  
                  unidade_atual++
  
              }

            }

            console.log("Dados emissão: ", dados_emissao);


            const svg = d3.select(vis.refs.svg);

            svg
              .selectAll("rect.emissao")
              .data(dados_emissao)
              .join("rect")
              .attr("y", d => vis.draw.components.scales.y(d.pos_y))
              .attr("x", d => vis.draw.components.scales.x(d.pos_x))
              .attr("width", vis.params.unidade.tamanho)
              .attr("height", vis.params.unidade.tamanho)
              .attr("fill", "red");



            // let linha = ultima_linha_possivel;

            // const dados_emissao = [];





            // // ultima linha (de baixo para cima)

            // // const x_inicial = 

            // dados_emissao.push()


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

                    const x = (pos_x - 1)*(vis.params.unidade.tamanho + vis.params.unidade.margem) + vis.params.unidade.margem;

                    //console.log(pos_x, x);

                    return x

                },

                y : function(pos_y) {

                    const y = vis.dims.altura_necessaria - pos_y*(vis.params.unidade.tamanho + vis.params.unidade.margem);

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

            vis.grid.calcula(+4.8e12);
            vis.grid.dimensiona_container();
            vis.grid.cria_dataset();
            vis.utils.gera_posicoes_linha_completa();
            vis.draw.desenhas_rects();

        }

    }

}

vis.control.init();