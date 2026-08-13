export interface RegionTheme {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  isFree: boolean;
  iapProductId?: string;
  /** Word pools that make names + field notes feel local to the region. */
  creatures: string[];
  descriptors: string[];
  places: string[];
  seed: number;
  /** Plausible sighting-year range for generated entries. */
  years: [number, number];
}

export const REGION_THEMES: RegionTheme[] = [
  {
    id: 'pnw',
    name: 'The Pacific Northwest',
    tagline: 'Where the trees keep watch',
    tint: '#5D6B4E',
    isFree: true,
    seed: 1001,
    years: [1958, 2019],
    creatures: ['Sasquatch', 'Bigfoot', 'Skookum', 'Tree Watcher', 'Ridge Walker', 'Batsquatch', 'Timber Giant', 'Sisiutl', 'Forest Sentinel', 'Grey Man', 'Mud Howler', 'Fern Wraith'],
    descriptors: ['Silent', 'Towering', 'Moss-Backed', 'Hollow-Eyed', 'Rain-Soaked', 'Nine-Foot', 'Shy', 'Ancient', 'Lumbering', 'Elusive', 'Old-Growth', 'Fog-Bound'],
    places: ['Skookum Ridge', 'Cascade Pass', 'the Hoh Valley', 'Ape Canyon', 'Elk Flats', 'Cedar Hollow', 'the Logging Road', 'Rainier Foothills', 'Salmon Creek', 'Mist Basin'],
  },
  {
    id: 'appalachia',
    name: 'Appalachia',
    tagline: 'The old roads remember',
    tint: '#8A5A3B',
    isFree: true,
    seed: 2002,
    years: [1944, 2017],
    creatures: ['Mothman', 'Flatwoods Monster', 'Sheepsquatch', 'Snallygaster', 'Grafton Monster', 'Hollow Haint', 'Wampus', 'The Antlered', 'Coal Wraith', 'Bell Witch', 'Ridge Runner', 'White Thing'],
    descriptors: ['Red-Eyed', 'Winged', 'Pale', 'Coal-Black', 'Whispering', 'Faceless', 'Woolly', 'Long-Armed', 'Restless', 'Hollow', 'Storm-Borne', 'Silver'],
    places: ['Point Pleasant', 'the TNT Bunkers', 'Flatwoods', 'Blue Ridge', 'Coal Hollow', 'the Old Mine Road', 'Braxton County', 'Fog Ridge', 'the Green Bank', 'Chestnut Knob'],
  },
  {
    id: 'greatlakes',
    name: 'The Great Lakes',
    tagline: 'The big water keeps what it takes',
    tint: '#3E5C6B',
    isFree: false,
    iapProductId: 'region.greatlakes',
    seed: 3003,
    years: [1937, 2016],
    creatures: ['Dogman', 'Pressie', 'Bessie', 'Lake Serpent', 'Michigan Dogman', 'Melon Heads', 'Nain Rouge', 'Mishipeshu', 'Beast of Bray Road', 'Shore Stalker', 'Ore-Dock Wraith', 'Ice Howler'],
    descriptors: ['Deep-Water', 'Coiled', 'Wolf-Headed', 'Cold-Eyed', 'Serpentine', 'Grey', 'Storm-Driven', 'Long', 'Amber-Eyed', 'Freshwater', 'Sunken', 'Fog-Grey'],
    places: ['Whitefish Point', 'the Manistee Woods', 'Superior Shoals', 'the Ore Docks', 'Bray Road', 'Isle Royale', 'the Ferry Line', 'Sleeping Bear', 'Copper Harbor', 'the North Channel'],
  },
  {
    id: 'southwest',
    name: 'The Desert Southwest',
    tagline: 'The heat remembers what walked',
    tint: '#A6703F',
    isFree: false,
    iapProductId: 'region.southwest',
    seed: 4004,
    years: [1952, 2018],
    creatures: ['Chupacabra', 'Thunderbird', 'Skinwalker', 'Night Crawler', 'Sandhill Ghost', 'Mogollon Monster', 'Owlman', 'Dust Devil', 'Arroyo Beast', 'Mesa Stalker', 'Bone Walker', 'Sun Wraith'],
    descriptors: ['Spined', 'Vast-Winged', 'Shifting', 'Long-Legged', 'Leathery', 'Red-Eyed', 'Gaunt', 'Sun-Bleached', 'Silent', 'Feral', 'Dust-Caked', 'Hollow'],
    places: ['the Mogollon Rim', 'Skinwalker Ranch', 'Dead Horse Wash', 'the Mesa', 'Coyote Arroyo', 'the Superstition Range', 'Rattlesnake Flats', 'the Dry Basin', 'Saguaro Draw', 'Buzzard Point'],
  },
  {
    id: 'atlantic',
    name: 'New England & the Atlantic',
    tagline: 'The tide brings stranger things',
    tint: '#4A5A74',
    isFree: false,
    iapProductId: 'region.atlantic',
    seed: 5005,
    years: [1817, 2015],
    creatures: ['Champ', 'Dover Demon', 'Gloucester Serpent', 'Pukwudgie', 'Sea Serpent', 'Thunderbird', 'Wood Devil', 'Glawackus', 'Harbor Wraith', 'Bridgewater Beast', 'Fog Walker', 'Salt Haunt'],
    descriptors: ['Long-Necked', 'Grey-Skinned', 'Coiling', 'Small', 'Barnacled', 'Pale', 'Salt-Crusted', 'Storm-Grey', 'Slick', 'Ancient', 'Tide-Worn', 'Wide-Eyed'],
    places: ['Lake Champlain', 'Dover', 'Gloucester Harbor', 'the Bridgewater Triangle', 'Cape Ann', 'the Fog Banks', 'Hockomock Swamp', 'the Breakwater', 'Salem Sound', 'Provincetown Spit'],
  },
];
