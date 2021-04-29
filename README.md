# Dívida

Este projeto, que nasceu como um projeto para criação de uma versão mais interativa e interessante do Relatório Mensal da Dívida (RMD), busca explicar as informações essenciais da dívida pública de uma forma simples, direta e interessante (hopefully).

### To-do

Verificar questões de acessibilidade. Botões, por exemplo.

### Inspirações

https://www.nytimes.com/interactive/2018/05/09/nyregion/subway-crisis-mta-decisions-signals-rules.html

https://datalab.usaspending.gov/americas-finance-guide/debt/

### Fontes

https://fonts.google.com/specimen/VT323#standard-styles
https://fonts.google.com/specimen/Press+Start+2P#about


### Sketch

!["sketch"](./other/sketch.jpg)

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
