import { FoodForThoughtEntry } from "./types";

// Hand-curated entries for the homepage "Food for thought" section.
// Each stat comes from the named primary source; keep sourceUrl pointing at the
// report or an authoritative page for the figure, and update `year` when a
// newer edition of the source is published.
export const foodForThought: FoodForThoughtEntry[] = [
  {
    id: "food-waste",
    title: "One-fifth of food available to consumers is wasted",
    topic: "food waste",
    stat: "About 1.05 billion tonnes of food were wasted in 2022 — roughly 19% of food available to consumers at retail, food service and household level.",
    summary:
      "Household kitchens account for about 60% of this waste, with food service and retail making up the rest. The waste occurs even as hundreds of millions of people face hunger, and food loss and waste together generate an estimated 8–10% of global greenhouse gas emissions.",
    aiAngle:
      "Computer-vision systems such as Winnow track what commercial kitchens throw away, cutting waste by measuring it, while ML demand-forecasting tools like Afresh help grocers order fresh food more precisely. Food banks use similar logistics optimization to route surplus food to redistribution.",
    source: "UNEP Food Waste Index Report 2024",
    sourceUrl: "https://www.stopfoodlosswaste.org/about/facts",
    year: 2022,
  },
  {
    id: "child-labor",
    title: "138 million children remain in child labour",
    topic: "child labour",
    stat: "Nearly 138 million children were engaged in child labour in 2024, including about 54 million in hazardous work.",
    summary:
      "Child labour has almost halved since 2000, with over 20 million fewer children since 2020 — but progress remains far too slow to meet elimination targets. Agriculture accounts for 61% of all child labour, much of it on family and smallholder farms, and sub-Saharan Africa carries the largest burden.",
    aiAngle:
      "Researchers at the University of Nottingham's Rights Lab have used machine learning on satellite imagery to map South Asian brick kilns, a sector associated with child and bonded labour, giving inspectors concrete targets. Similar ML-based supply-chain risk mapping is being applied to cocoa and mining regions.",
    source: "ILO/UNICEF Child Labour: Global Estimates 2024",
    sourceUrl:
      "https://www.ilo.org/publications/major-publications/child-labour-global-estimates-2024-trends-and-road-forward",
    year: 2024,
  },
  {
    id: "water",
    title: "One in four people lack safely managed drinking water",
    topic: "water",
    stat: "2.1 billion people — 1 in 4 globally — still lacked safely managed drinking water services in 2024.",
    summary:
      "Global coverage rose from 68% to 74% between 2015 and 2024, but progress is uneven: rural coverage is 60% against 83% in urban areas. A further 3.4 billion people lack safely managed sanitation, a major driver of waterborne disease.",
    aiAngle:
      "Machine-learning models trained on the Water Point Data Exchange predict which rural handpumps and wells are likely to fail, letting maintenance crews act before communities lose access. ML is also used for groundwater mapping and detecting leaks in piped networks.",
    source: "WHO/UNICEF Joint Monitoring Programme 2000–2024",
    sourceUrl:
      "https://www.who.int/news/item/26-08-2025-1-in-4-people-globally-still-lack-access-to-safe-drinking-water---who--unicef",
    year: 2024,
  },
  {
    id: "hunger",
    title: "673 million people faced hunger in 2024",
    topic: "hunger",
    stat: "An estimated 673 million people — 8.3% of the world's population — faced hunger in 2024, and about 2.3 billion experienced moderate or severe food insecurity.",
    summary:
      "Global hunger declined slightly from 2023, but the improvement is uneven: more than one in five people in Africa faced hunger in 2024, and food insecurity remains 335 million people above pre-pandemic levels. On current trends, 512 million people could still face hunger in 2030.",
    aiAngle:
      "The World Food Programme's HungerMap LIVE uses machine learning to nowcast food insecurity in near real time where survey data is sparse, guiding where assistance is directed. ML-based crop-yield forecasting from satellite data supports earlier famine warning through systems like FEWS NET.",
    source: "FAO et al., State of Food Security and Nutrition in the World 2025",
    sourceUrl:
      "https://www.fao.org/newsroom/detail/global-hunger-declines--but-rises-in-africa-and-western-asia--un-report/en",
    year: 2024,
  },
  {
    id: "modern-slavery",
    title: "50 million people live in modern slavery",
    topic: "modern slavery",
    stat: "An estimated 50 million people were living in modern slavery on any given day in 2021 — 28 million in forced labour and 22 million in forced marriage.",
    summary:
      "This is 10 million more than the previous 2016 estimate. The problem is not confined to poor countries: more than half of forced labour occurs in upper-middle and high-income countries, and nearly one in eight people in forced labour is a child.",
    aiAngle:
      "Global Fishing Watch and academic collaborators trained machine-learning models on vessel-tracking data to flag fishing vessels showing behaviour consistent with forced labour, work published in PNAS. Satellite imagery combined with ML is also used to detect sites linked to bonded labour.",
    source: "ILO/Walk Free/IOM Global Estimates of Modern Slavery 2022",
    sourceUrl:
      "https://www.ilo.org/publications/major-publications/global-estimates-modern-slavery-forced-labour-and-forced-marriage",
    year: 2021,
  },
  {
    id: "education",
    title: "273 million children and youth are out of school",
    topic: "education",
    stat: "273 million children and young people — about one in six of school age — were out of school in 2024, the seventh consecutive year of increase.",
    summary:
      "Population growth, armed conflict and shrinking education budgets are driving the numbers up, even though global enrolment in primary and secondary education has grown 30% since 2000. Sub-Saharan Africa shows the sharpest deceleration in progress.",
    aiAngle:
      "AI tutors designed for low-connectivity settings, such as Rori from Rising Academies, deliver personalized math practice over WhatsApp on basic phones in Ghana, with early trials showing measurable learning gains. Machine translation is also lowering the cost of localizing learning materials into underserved languages.",
    source: "UNESCO Global Education Monitoring Report 2026",
    sourceUrl:
      "https://www.unesco.org/en/articles/more-children-out-school-7th-year-row-273-million",
    year: 2024,
  },
  {
    id: "child-mortality",
    title: "4.9 million children died before their fifth birthday",
    topic: "health",
    stat: "An estimated 4.9 million children died before age five in 2024, including 2.3 million newborns — most from preventable causes.",
    summary:
      "Under-five deaths have fallen by more than half since 2000, but the pace of reduction has slowed by over 60% since 2015. Sub-Saharan Africa accounted for 58% of all under-five deaths in 2024, and proven low-cost interventions such as vaccines and skilled care at birth could avert most of them.",
    aiAngle:
      "Macro-Eyes has used machine learning to forecast vaccine demand at individual clinics in Tanzania and Mozambique, reducing wastage and stock-outs in immunization supply chains. AI-assisted diagnostics, such as automated chest X-ray reading for childhood pneumonia, are being trialled where radiologists are scarce.",
    source: "UN IGME Levels and Trends in Child Mortality 2025",
    sourceUrl:
      "https://www.who.int/news/item/18-03-2026-progress-in-reducing-child-deaths-slows-as-4.9-million-children-die-before-age-five",
    year: 2024,
  },
  {
    id: "energy",
    title: "666 million people still live without electricity",
    topic: "energy",
    stat: "Over 666 million people lacked access to electricity in 2023, 85% of them in sub-Saharan Africa; 2.1 billion still lack clean cooking fuels.",
    summary:
      "The number without basic electricity access fell for the first time in a decade, and nearly 92% of the world now has basic access. Clean cooking progress, however, is being outpaced by population growth, leaving households exposed to indoor air pollution from wood and charcoal.",
    aiAngle:
      "Village Data Analytics applies machine learning to satellite imagery to identify villages where off-grid solar mini-grids are viable, and similar ML-based electrification mapping by the World Bank and partners informs national grid-extension planning at a fraction of the cost of ground surveys.",
    source: "IEA et al., Tracking SDG7: The Energy Progress Report 2025",
    sourceUrl: "https://www.iea.org/reports/tracking-sdg7-the-energy-progress-report-2025",
    year: 2023,
  },
  {
    id: "maternal-health",
    title: "260,000 women died from pregnancy-related causes",
    topic: "maternal health",
    stat: "About 260,000 women died from maternal causes in 2023 — over 90% of them in low- and lower-middle-income countries — and most deaths were preventable.",
    summary:
      "The health-care solutions to prevent or manage complications of pregnancy and childbirth are well known, yet access to skilled care remains highly unequal. A woman's lifetime risk of maternal death in a low-income country is many times that in a high-income one.",
    aiAngle:
      "Google Health and Jacaranda Health in Kenya have tested AI software that reads low-cost portable ultrasound sweeps to estimate gestational age and flag risks, letting midwives without sonography training provide prenatal screening. ML triage of danger signs is also built into maternal SMS-helpline services such as Jacaranda's PROMPTS.",
    source: "WHO Trends in Maternal Mortality 2000–2023",
    sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/maternal-mortality",
    year: 2023,
  },
];
