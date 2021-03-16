const vis = {

    params : {

        unidade : {
            
            valor: +5e9,
            tamanho: 10,
            margem: 4,
            qde_por_linha : 20

        },

        espaco_inicial: 400

    },

    refs : {

        svg : "svg",
        container : ".svg-container"
    
    },

    selections : {

        rects_divida : null

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

        registra_pagamento : function(valor, posicao_inicial) {

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);

            console.log("Para este pagamento de ", valor, ", apagaremos ", qde_unidades, " quadradinhos.");

            // acha o index do elemento inicial no dataset

            const index_primeiro = vis.data.divida
              .map(elemento => elemento.unidade)
              .indexOf(posicao_inicial)
            ;

            const elementos_removidos = vis.data.divida.splice(index_primeiro, qde_unidades);

            console.log("Foram removidos, a partir do index ", index_primeiro, ": ", elementos_removidos);

            // atualiza data join

            vis.selections.rects_divida
              .data(vis.data.divida, d => d.unidade)
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
              .remove();

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

    control : {

        init : function() {

            vis.grid.calcula(+4.8e12);
            vis.grid.dimensiona_container();
            vis.grid.cria_dataset();
            vis.draw.desenhas_rects();

        }

    }

}

vis.control.init();