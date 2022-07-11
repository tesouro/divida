# Dívida

Este projeto, que nasceu como um projeto para criação de uma versão mais interativa e interessante do Relatório Mensal da Dívida (RMD), busca explicar as informações essenciais da dívida pública de uma forma simples, direta e interessante (hopefully).

### To-do

Verificar questões de acessibilidade. Botões, por exemplo.

[ ] experimentar scrollTrigger
[ ] espaçamentos no alto e em baixo para compensar barras do celular.
[ ] textos menores
[ ] tela final
[ ] prever casos em que mais de uma linha final do grid fantasma vai estar incompleta

### Tips

To target an HTML link to a specific page in a PDF file, add #page=[page number] to the end of the link's URL.

For example, this HTML tag opens page 4 of a PDF file named myfile.pdf:

```html
<A HREF="http://www.example.com/myfile.pdf#page=4">
```
(https://helpx.adobe.com/acrobat/kb/link-html-pdf-page-acrobat.html)

Mas e na chamada dos links das publicações do TT? Coisas tipo: https://sisweb.tesouro.gov.br/apex/f?p=2501:9::::9:P9_ID_PUBLICACAO:41270


### Inspirações

https://www.nytimes.com/interactive/2018/05/09/nyregion/subway-crisis-mta-decisions-signals-rules.html

https://datalab.usaspending.gov/americas-finance-guide/debt/

### Fontes

https://fonts.google.com/specimen/VT323#standard-styles
https://fonts.google.com/specimen/Press+Start+2P#about


### Sketch

!["sketch"](./other/sketch.jpg)

### Novo texto

TETRIS

O retângulo azul comporta o PIB do Brasil e cada quadradinho representa R$ 10 bilhões.

Quanto era?
Ao final de 2019, R$ 4.25 trilhões

Quanto custa?
Ao longo de 2020, a dívida custou R$ 410 bilhões em juros.

Quanto vence no ano?
R$ 1,18 trilhão do principal da dívida vence nesse período. 

Como se paga?
Do total de R$ 1,59 trilhão, R$ 600 bilhões foram pagos com dinheiro do orçamento.

O restante (R$ 990 bilhões) foi refinanciado, ou seja, trocado por uma dívida nova, em uma operação conhecida como “rolagem” da dívida.

Déficit primário
Nos últimos anos, o governo tem gastado mais do que arrecada, por isso precisa contrair empréstimos para custear esse déficit nas contas. Em 2020, esse valor adicional foi de R$ 767 bilhões.


### Comentários

Referencial: 

```

y  |  x

...
---+----+----+----+----+----+----+----+----+----+----|
04 |  1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |  9 | 10 |
---+----+----+----+----+----+----+----+----+----+----|
03 |  1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |  9 | 10 |
---+----+----+----+----+----+----+----+----+----+----|
02 |  1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |  9 | 10 |
---+----+----+----+----+----+----+----+----+----+----|
01 |  1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |  9 | 10 |
---+----+----+----+----+----+----+----+----+----+----|


```

Sempre assumiremos que os pagamentos vão começar do primeiro elemento à esquerda de determinada linha. Com isso, em qualquer caso sempre teremos `n` linhas completas removidas, e no máximo `1` linha incompleta restante.


E agora, fazer com greensock ou d3 puro?

## Greensock

https://greensock.com/docs/v2/Easing
https://greensock.com/docs/v2/TimelineMax/staggerTo()


```js

const cont = d3.select(".svg-container");

cont             
    .selectAll("div.rect")
    .data(vis.data.divida, d => d.unidade)
    .join("div")
    .classed("rect", true)
    .style("position", "absolute")
    .style("background-color", "coral")
    .style("left", d => vis.draw.components.scales.x(d.pos_x) + "px" )
    .style("top", d => vis.draw.components.scales.y(d.pos_y) +"px" )
    .style("width", vis.params.unidade.tamanho + "px")
    .style("height", vis.params.unidade.tamanho + "px")
    .style("transform", "scale(0)");

let anim = new TimelineLite({paused: true});

anim.staggerTo("div.rect", 1, {
  scale: 1,
  ease: Back.easeOut,
  stagger: {
    grid: "auto",
    from: "start",
    axis: "y",
    each: 0.08
  }
});

anim.play(0);
anim.reverse();

```

Parti para uma solução mais direta, sem ser tão genérica.



Cria divs refin: 

```js
vis.render.cria_divs('emissao_refin');


document.querySelectorAll('[data-tipo="emissao_refin"]').forEach(el => el.style.top = vis.render.components.scales.y(el.dataset.pos_y_emissao) + 'px')

```

Lá no desloca, poderia deixar com uma opção de marcar os quadradinhos que vão ser deslocados, e deslocar sempre para a 'pos_y'. Aí no cálculo dos pagamentos, incluir a posição anterior ao pagamento como 'pos_y_anterior', passando esse 'tipo_pos_y' na chamada da funcão `cria_divs`.


Em vez de me preocupar com posicoes finais em px, poderia apenas calcular deslocamentos em termos de linhas, e aí usar transforms para ajustar as posições.

```html
<div class="container">
  <div class="obj" id="obj1" data-finalposition="200">1</div>
  <div class="obj" id="obj2" data-finalposition="400">2</div>
</div>
```

```css

.container {
  position: relative;
}

.obj {
  position: absolute;
    color: white;
  font-size: 5rem;
  width: 5rem;
  text-align: center;
}

#obj1 {
  top: 20px;
  left: 20px;
  background-color: blue;
}

#obj2 {
  top: 120px;
  left: 20px;
  background-color: coral;
}
```

```js

gsap.to('.obj', {x: getValue})

function getValue(i, target) {
  console.log(i, +target.dataset.finalposition);
  return +target.dataset.finalposition;
}

```

então o ideal seria, faz todos os cálculos do grid, marcando posições iniciais e "posicao_seguinte1", "posicao_seguinte2". depois cria todos os divs (inclusive os fantasmas), todos com opacity 0. aí define as animações:

1. aparecem estoque_inicial, vencimentos_refin, vencimentos_outras, com uma mesma cor. Poder ser um stagger?

2. aparecem os juros_refin, animando para cima. ver artigo do will.

3. muda cor dos vencimentos, para destacá-los.

4. destaca vencimentos_outras (pisca? brilha? põe margem?) e faz sumir (scale to 0). desloca quadradinhos para baixo. (posicao_seguinte1, dos que estão marcados)

5. destaca juros com outras fontes, mesma coisa do anterior.

6. destaca juros_refin e vencimentos_refin. faz sumir, deixa grid atrás, aparece emissão. desloca emissão.

6*. talvez seja preciso mexer em algo aqui, por causa da disposição dos quadradinhos. comparar última linha do grid com a última da emissão refin.

7 aparece emissão do vazamento. "A história pararia aqui, se bla bla".

### scroller. fazer voltando:

```js

    enterView({
        selector: ".slide",
        offset: 0.5,
        enter: function(el) {

            let step = +el.id.slice(-2);
            // aqui não preciso me preocupar com direção, pq ele só "enter" na descida.
            steps.push(step);
            console.log(steps);
            console.log("avançando");

            desenha(step, "descendo");
        },

        exit: function(el) {

            let step = +el.id.slice(-2) - 1;
            // pois aqui tb não preciso me preocupar com direção, pq aparentemente só "exit" na subida 
            steps.push(step);
            console.log(steps);
            console.log("voltando");

            desenha(step, "voltando");
    )}


  ```

  Na prática, vou trocar os passos do scroller por steps da animação.

  Precisa do enter-view? já que são botões...



```js
let estoque_inicial = {
            
            tl : new gsap.timeline({paused: true})
                         .to(".quadradinho", {
                            duration: 1,
                            scale: 1,
                            stagger: {
                            grid: "auto",
                            from: "random",
                            axis: "both",
                            amount: 1.5
                            }
                        }),

            play: function() {
                this.tl.play()
            },

            reverse : function() {
                this.tl.reverse()
            }

        }

estoque_inicial.play();
estoque_inicial.reverse();
```

funciona. Mas :

```js

vis : {

    anim : {

        estoque_inicial : {
            
            tl : new gsap.timeline({paused: true})
                         .to(".quadradinho", {
                            duration: 1,
                            scale: 1,
                            stagger: {
                            grid: "auto",
                            from: "random",
                            axis: "both",
                            amount: 1.5
                            }
                        }),

            play: function() {
                this.tl.play()
            },

            reverse : function() {
                this.tl.reverse()
            }
         }
    }
}

```

Assim tb funciona. Que loucura.

```js
const obj = { 
    
    anims : {

        estoque_inicial3 : {
                    
            tl : new gsap.timeline({paused: true})
                        .to(".quadradinho", {
                            duration: 1,
                            scale: 1,
                            stagger: {
                            grid: "auto",
                            from: "random",
                            axis: "both",
                            amount: 1.5
                            }
                        }),

            play: function() {
                this.tl.play()
            },

            reverse : function() {
                this.tl.reverse()
            }
        }
    }
}


```

Como fiz antes:

```js

const anims = {

    estoque_inicial : {
                
        tl : new gsap.timeline({paused: true})
                    .to(vis.refs.container, {
                        opacity : 1,
                        duration: 1
                    })
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

                    }, '<'),

        play: function() {
            this.tl.play()
        },

        reverse : function() {
            this.tl.reverse()
        }

    },

    juros : {

        tl : new gsap.timeline({paused: true})
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
                     }),

        play: function() {
            this.tl.play()
        },

        reverse : function() {
            this.tl.reverse()
        }

    },

    vencimentos : {

        tl : new gsap.timeline({paused : true})
                     .to(vis.refs.vencimentos, {
                         backgroundColor : vis.params.colors.orange,
                         stagger: {
                            grid: "auto",
                            from: "start",
                            axis: "both",
                            each: 0.1
                            }
                     }),

        play: function() {
            this.tl.play()
        },

        reverse : function() {
            this.tl.reverse()
        }

    },

    vencimentos_outras_fontes : {

        tl : new gsap.timeline({paused : true})
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
                     
                     ,

        play: function() {
            this.tl.play()
        },

        reverse : function() {
            this.tl.reverse()
        }

    },

    // apaga_vencimentos_outras_fontes : {

    //     tl : new gsap.timeline({paused : true})
    //                  .to(vis.refs.vencimentos_outras_fontes, {
    //                      scale : 0
    //                  })
    //                  .to(vis.refs.deslocar_vencimentos, {
    //                      ease: SteppedEase.config(6),
    //                      y : vis.utils.get_data.vencimentos_outras_fontes
    //                  }),

    //     play: function() {
    //     this.tl.play()
    //     },

    //     reverse : function() {
    //     this.tl.reverse()
    //     }

    // },

    juros_outras_fontes : {

        tl : new gsap.timeline({paused : true})
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
                     }),

        play: function() {
            this.tl.play()
        },

        reverse : function() {
            this.tl.reverse()
        }

    },

    // apaga_juros_outras_fontes : {

    //     tl : new gsap.timeline({paused : true})
    //                  .to(vis.refs.juros_outras_fontes, {
    //                     ease: Back.easeOut,
    //                      scale : 0
    //                  })
    //                  .to(vis.refs.deslocar_juros, {
    //                      ease: SteppedEase.config(6),
    //                      y : vis.utils.get_data.juros_outras_fontes
    //                  }),

    //     play: function() {
    //     this.tl.play()
    //     },

    //     reverse : function() {
    //     this.tl.reverse()
    //     }
        
    // },

    emissao_refin : {

        tl : new gsap.timeline({paused : true})
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
                     }),

        play: function() {
        this.tl.play()
        },

        reverse : function() {
        this.tl.reverse()
        }

    },

    emissao_vazamento : {

        tl : new gsap.timeline({paused : true})
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
                     }),

        play: function() {
        this.tl.play()
        },

        reverse : function() {
        this.tl.reverse()
        }

    },

    incorpora : {
                
        tl : new gsap.timeline({paused: true})
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

                    }, '<'),

        play: function() {
            this.tl.play()
        },

        reverse : function() {
            this.tl.reverse()
        }

    }

}

```

Isso combinado com o monitoramento dos botões que disparavam as animações:

```js

monitora_botoes : function() {

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
}

```

Os botões eram esse anchor tags dentro do markup de cada slide, assim: 

```html
<div class="slide stepper" id="step1">
    <div class="container-step" data-step="estoque inicial">
        <h3>Quanto é (era)?</h3>
        <p> 
          bla bla bla
        </p>
        <div class="wrapper-navigation">
            <a href="#abertura" class="back" data-previous="estoque_inicial"> &lt; </a>
            <a href="#step2" class="next" data-next="juros"> &gt; </a>
        </div>
    </div>
</div>
```

### Coisas que ajudaram

https://www.quora.com/What-are-the-different-blocks-in-Tetris-called-Is-there-a-specific-name-for-each-block

https://www.sarasoueidan.com/blog/horizontal-rules/