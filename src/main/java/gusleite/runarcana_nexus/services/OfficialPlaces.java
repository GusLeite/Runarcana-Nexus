package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.PoiKind;

import java.util.List;

// Catálogo de lugares do mapa oficial de Runeterra. O mestre liga e desliga cada um para os jogadores.
// As posições são aproximadas (partem do brasão da região no mapa); o mestre pode mover qualquer ponto.
public final class OfficialPlaces {

    public record Place(String key, String region, String name, PoiKind kind, double x, double y, String description) {}

    private OfficialPlaces() {}

    private static Place p(String key, String region, String name, PoiKind kind, double x, double y, String description) {
        return new Place(key, region, name, kind, x, y, description);
    }

    public static final List<Place> ALL = List.of(
            // Noxus
            p("cidade-noxiana", "noxus", "Cidade Noxiana", PoiKind.CITY, 18, 150, "Capital do Império Noxiano, onde a força vale mais que o berço."),
            p("grande-muralha-noxus", "noxus", "Fortificações do Norte", PoiKind.OUTPOST, -70, 215, "Linha de fortes que guarda a fronteira de Noxus."),
            // Demacia
            p("cidade-demacia", "demacia", "Cidade de Demacia", PoiKind.CITY, -420, 55, "A capital do reino, cercada por muralhas brancas e douradas."),
            p("grande-barreira", "demacia", "Grande Barreira", PoiKind.LANDMARK, -345, 85, "Muralha monumental que isola Demacia do resto do continente."),
            p("petricita", "demacia", "Cavernas de Petricita", PoiKind.MYSTERY, -480, 105, "Pedra que anula a magia, extraída e vigiada pelo reino."),
            // Freljord
            p("avarosa", "freljord", "Avarosa", PoiKind.CITY, -330, 262, "Tribo e cidade do gelo, lar da Guarda do Inverno."),
            p("fortaleza-guarda-gelida", "freljord", "Fortaleza Guarda-Gélida", PoiKind.OUTPOST, -395, 305, "Bastião dos Guarda-Gélidos, às margens do gelo eterno."),
            p("serilia", "freljord", "Serilia", PoiKind.CITY, -285, 320, "Assentamento do clã Lokfar, entre fiordes e geleiras."),
            p("rakelstake", "freljord", "Rakelstake", PoiKind.LANDMARK, -440, 240, "Vale sagrado de rituais antigos do Freljord."),
            // Ionia
            p("placidium", "ionia", "Placidium", PoiKind.CITY, 520, 205, "Cidade ionia de templos e jardins, centro de debates e artes."),
            p("navori", "ionia", "Navori", PoiKind.RUIN, 585, 250, "Província marcada pelas cicatrizes da guerra e pelo luto."),
            p("shon-xan", "ionia", "Shon-Xan", PoiKind.CITY, 495, 270, "Cidade no alto do Monte Sentinela, de tradição espiritual."),
            p("templo-kinkou", "ionia", "Templo Kinkou", PoiKind.HIDEOUT, 560, 180, "Refúgio da ordem que busca o equilíbrio entre o espiritual e o material."),
            // Shurima
            p("disco-solar", "shurima", "Disco Solar", PoiKind.LANDMARK, 85, -335, "O grande disco de ouro de Shurima, símbolo do poder dos Ascendidos."),
            p("nashramae", "shurima", "Nashramae", PoiKind.RUIN, 20, -380, "Cidade-tumba dos Ascendidos, sepultada pelas areias."),
            p("oasis-shurima", "shurima", "Oásis de Shurima", PoiKind.CAMP, 120, -385, "Ponto de descanso das caravanas no coração do deserto."),
            p("xer-sai", "shurima", "Tocas Xer'Sai", PoiKind.DANGER, 30, -320, "Ninhos do Vazio sob o deserto, onde as criaturas aguardam."),
            // Targon
            p("monte-targon", "targon", "Monte Targon", PoiKind.LANDMARK, -240, -355, "A montanha mais alta de Runeterra, tocada pelos céus."),
            p("templo-solari", "targon", "Templo Solari", PoiKind.CITY, -265, -395, "Santuário do Sol, de devotos de armadura dourada."),
            p("templo-lunari", "targon", "Templo Lunari", PoiKind.CITY, -215, -410, "Santuário da Lua, dos que seguem a luz da noite."),
            // Ixtal
            p("ixaocan", "ixtal", "Ixaocan", PoiKind.CITY, 290, -320, "Capital escondida de Ixtal, dominada pelas magias elementais."),
            p("selva-ixtal", "ixtal", "Selva de Ixtal", PoiKind.MYSTERY, 330, -350, "Floresta fechada onde estrangeiros raramente voltam."),
            // Piltover e Zaun
            p("piltover", "piltover-zaun", "Piltover", PoiKind.CITY, 205, -95, "Cidade do progresso, de comércio e invenções hextec."),
            p("zaun", "piltover-zaun", "Zaun", PoiKind.CITY, 185, -128, "A cidade sob Piltover, entre vapores e experimentos químicos."),
            // Águas de Sentina
            p("aguas-de-sentina", "bilgewater", "Águas de Sentina", PoiKind.PORT, 565, -165, "Porto de piratas, caçadores de monstros e contrabandistas."),
            p("ilhas-serpente", "bilgewater", "Ilhas da Serpente", PoiKind.DANGER, 600, -215, "Arquipélago infestado de monstros marinhos."),
            p("ilhas-buhru", "bilgewater", "Ilhas Buhru", PoiKind.LANDMARK, 540, -230, "Ilhas habitadas por povos que vivem do mar."),
            // Ilhas das Sombras
            p("camavor", "shadow-isles", "Camavor", PoiKind.RUIN, 690, -380, "Antiga capital, hoje arruinada e assombrada pela Névoa Negra."),
            p("nevoa-negra", "shadow-isles", "Coração da Névoa Negra", PoiKind.DANGER, 715, -410, "Onde a Ruína nasceu e onde ela é mais forte."),
            // O Vazio e Icathia
            p("icathia", "void", "Ruínas de Icathia", PoiKind.RUIN, 275, -565, "O reino devorado pelo Vazio, agora apenas ruínas e fendas."),
            p("fenda-vazio", "void", "Fenda do Vazio", PoiKind.DANGER, 250, -520, "Rasgo na realidade por onde o Vazio avança.")
    );
}
