library(tidyverse)
library(readxl)
library(jsonlite)

raw <- read_excel('prototipo-titulo-tetris.xlsx', sheet = 'tetris')
piece_info <- read_excel('prototipo-titulo-tetris.xlsx', sheet = 'tab-tipos')

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

proc_with_piece_info <- proc_treated %>%
  left_join(piece_info)

jsonlite::write_json(proc_with_piece_info, '../abertura.json')


# separator ---------------------------------------------------------------

sep <- read_excel('prototipo-titulo-tetris.xlsx', sheet = 'separator')

sep_proc <- data.frame()
n <- 1

for (i in 1:nrow(sep)) {
  
  for (j in 1:ncol(sep)) {
    
    if (!is.na(sep[i,j])) {
      
      sep_proc[n, "piece"] <- n
      sep_proc[n, "x"] <- j-1
      sep_proc[n, "y"] <- i-1
      
      n <- n+1
      
    }
    
  }
}

sep_proc_treated <- sep_proc %>%
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
    d = paste(d, collapse = ' ')
  ) %>%
  ungroup() %>%
  mutate(
    element = paste0('<path d="',d,'"></path>')
  )

sep_out <- sep_proc_treated$element %>% paste(collapse = '\n')

write_file(sep_out, file = "sep_out.html")
