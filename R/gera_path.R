library(tidyverse)
library(readxl)
library(jsonlite)

raw <- read_excel('prototipo-titulo-tetris.xlsx')

proc <- data.frame()
n <- 1

for (i in 1:nrow(raw)) {
  for (j in 1:ncol(raw)) {
    
    if (!is.na(raw[i,j])) {
      
      proc[n, "piece"] <- raw[i,j]
      proc[n, "x"] <- j-1
      proc[n, "y"] <- i-1
      proc[n, "transform"] <- round(ncol(raw)/2, 0) - (j-1)
      
      n <- n+1
      
    }
    
  }
}

proc_treated <- proc %>%
  arrange(piece) %>%
  mutate(d = paste(
    "M", x, y,
    "H", x + 1,
    "V", y + 1,
    "H", x,
    "V", y
  )) %>%
  group_by(piece) %>%
  summarise(
    d = paste(d, collapse = ' '),
    transform = first(transform)
  )

jsonlite::write_json(proc_treated, '../abertura.json')
