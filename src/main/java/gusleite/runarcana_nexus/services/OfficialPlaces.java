package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.PoiKind;

import java.util.List;

// Lugares do mapa oficial de Runeterra que têm modelo 3D (nome e posição como no mapa original; os outros 91 saíram
// para deixar o mapa leve e abrir espaço aos lugares do mestre). O mestre liga e desliga
// cada um para os jogadores. A região é a do brasão mais próximo, só para agrupar na lista do mestre.
public final class OfficialPlaces {

    public record Place(String key, String region, String name, PoiKind kind, double x, double y) {}

    private OfficialPlaces() {}

    private static Place p(String key, String region, String name, PoiKind kind, double x, double y) {
        return new Place(key, region, name, kind, x, y);
    }

    public static final List<Place> ALL = List.of(
            p("demacia-city-landmark", "demacia", "A Grande Cidade de Demacia", PoiKind.LANDMARK, -456, 37),
            p("frostguard", "freljord", "A Cidadela Praeglacius", PoiKind.LANDMARK, -215, 399),
            p("immortal-bastion", "noxus", "O Bastião Imortal", PoiKind.LANDMARK, -5, 110),
            p("ixaocan", "ixtal", "Ixaocan", PoiKind.LANDMARK, 333, -382),
            p("mount-targon", "targon", "Monte Targon", PoiKind.LANDMARK, -201, -424),
            p("placidium", "ionia", "O Placídio de Navori", PoiKind.LANDMARK, 480, 240),
            p("sun-disc", "shurima", "O Disco Solar", PoiKind.LANDMARK, 3, -416),
            p("the-void", "void", "O Vazio", PoiKind.LANDMARK, 270, -537)
    );
}
