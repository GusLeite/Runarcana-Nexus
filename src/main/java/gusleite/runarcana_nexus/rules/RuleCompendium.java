package gusleite.runarcana_nexus.rules;

import java.util.List;

// Páginas de consulta do livro que não mudam a criação (rules/compendio.json): Familiares e Companheiros Animais e
// A Tecmaturgia com os Aparatos. Cada página é uma lista de seções (título, nível do título 1 a 5, texto e tabelas),
// na ordem do livro; a seção sem título é a introdução.
public record RuleCompendium(List<Page> pages) {
    public List<Page> pagesOrEmpty() {
        return pages == null ? List.of() : pages;
    }

    public record Page(String id, String title, String chapter, List<Section> sections) {
        public List<Section> sectionsOrEmpty() {
            return sections == null ? List.of() : sections;
        }
    }

    public record Section(String title, Integer depth, String text, List<Table> tables) {
        public List<Table> tablesOrEmpty() {
            return tables == null ? List.of() : tables;
        }
    }

    public record Table(String name, List<String> columns, List<List<String>> rows) {}
}
