# Dívida

Este projeto, que nasceu como um projeto para criação de uma versão mais interativa e interessante do Relatório Mensal da Dívida (RMD), busca explicar as informações essenciais da dívida pública de uma forma simples, direta e interessante (hopefully).

### Inspirações

https://www.nytimes.com/interactive/2018/05/09/nyregion/subway-crisis-mta-decisions-signals-rules.html

https://datalab.usaspending.gov/americas-finance-guide/debt/


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
