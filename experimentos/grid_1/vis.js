const vis = {

    params : {

        unidade : {
            
            valor: +1e9,
            tamanho: 5,
            margem: 1,
            qde_por_linha : 10

        }

    },

    refs : {

        svg : "svg",
        container : ".svg-container"
    
    },

    dims : {

        largura_necessaria : null,
        altura_necessaria : null

    },

    data : {

    },

    grid : {

        calcula : function(valor) {

            const qde_unidades = Math.round(valor/vis.params.unidade.valor);
            const qde_linhas = Math.floor(qde_unidades / vis.params.unidade.qde_por_linha);

            function dimensao_necessaria(qde_na_dimensao) {

                return (qde_na_dimensao * (vis.params.unidade.tamanho + vis.params.unidade.margem) + vis.params.unidade.margem);

            }

            vis.dims.altura_necessaria  = dimensao_necessaria(qde_linhas);
            vis.dims.largura_necessaria = dimensao_necessaria(vis.params.unidade.qde_por_linha);

            console.log("Precisaremos de ", qde_unidades, " unidades, ", qde_linhas, " linhas, e uma largura de ", dimensao_necessaria(vis.params.unidade.qde_por_linha), "px e uma altura de ", dimensao_necessaria(qde_linhas), "px.");

        },

        dimensiona_container : function() {

            const cont = d3.select(vis.refs.container);
            const svg = d3.select(vis.refs.svg);

            cont.style("width", vis.dims.largura_necessaria + "px");
            svg.style("height", vis.dims.altura_necessaria + "px");


        },

        cria : function() {

            vis.grid.calcula(+4.8e11);
            vis.grid.dimensiona_container();


            // 



        }

    },

    init : function() {

        vis.grid.cria();

    }

}

vis.init();