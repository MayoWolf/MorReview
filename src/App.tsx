import { useState, useEffect } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import VideoPlayer from './components/VideoPlayer'
import { getVideoUrlForUnit } from './config/videoUrls'
import { startAnalytics, trackUnitSelect } from './lib/analytics'

export interface Topic {
  id: string;
  name: string;
  concepts: string[];
}

export interface Unit {
  id: number;
  title: string;
  videoUrl: string;
  description: string;
  topics: Topic[];
}

const units: Unit[] = [
  { 
    id: 1, 
    title: 'Unit 1: Thinking Geographically', 
    videoUrl: getVideoUrlForUnit(1), 
    description: 'Learn how geographers use maps and data to depict relationships of time, space, and scale.',
    topics: [
      { id: '1.1', name: 'Introduction to Maps', concepts: ['Reference vs thematic maps', 'Absolute and relative distance', 'Map projections and distortion'] },
      { id: '1.2', name: 'Geographic Data', concepts: ['Field observations', 'Geospatial technologies (GIS, GPS, Remote Sensing)'] },
      { id: '1.3', name: 'The Power of Geographic Data', concepts: ['Use of census data and satellite imagery at various scales'] },
      { id: '1.4', name: 'Spatial Concepts', concepts: ['Location, space, place, and flows', 'Distance decay and time-space compression'] },
      { id: '1.5', name: 'Human-Environmental Interaction', concepts: ['Sustainability and natural resources', 'Environmental determinism vs. possibilism'] },
      { id: '1.6', name: 'Scales of Analysis', concepts: ['Global, regional, national, and local perspectives'] },
      { id: '1.7', name: 'Regional Analysis', concepts: ['Formal, functional, and perceptual/vernacular regions'] }
    ]
  },
  { 
    id: 2, 
    title: 'Unit 2: Population and Migration Patterns and Processes', 
    videoUrl: getVideoUrlForUnit(2), 
    description: 'Analyze patterns associated with human populations and their movement.',
    topics: [
      { id: '2.1', name: 'Population Distribution', concepts: ['Physical and human factors of distribution', 'Scales of analysis'] },
      { id: '2.2', name: 'Consequences of Population Distribution', concepts: ['Service provision', 'Carrying capacity'] },
      { id: '2.3', name: 'Population Composition', concepts: ['Age-sex structure', 'Population pyramids'] },
      { id: '2.4', name: 'Population Dynamics', concepts: ['Fertility, mortality, and migration rates', 'Natural increase and doubling time'] },
      { id: '2.5', name: 'Demographic Transition Model', concepts: ['Stages of DTM', 'Epidemiological transition'] },
      { id: '2.6', name: 'Malthusian Theory', concepts: ['Population vs. food supply', 'Neo-Malthusian critiques'] },
      { id: '2.7', name: 'Population Policies', concepts: ['Pronatalist, antinatalist, and immigration policies'] },
      { id: '2.8', name: 'Women and Demographic Change', concepts: ['Education and healthcare access', 'Reduced fertility rates'] },
      { id: '2.9', name: 'Aging Populations', concepts: ['Political, social, and economic consequences', 'Dependency ratio'] },
      { id: '2.10', name: 'Causes of Migration', concepts: ['Push and pull factors (economic, social, political, environmental)'] },
      { id: '2.11', name: 'Forced and Voluntary Migration', concepts: ['Refugees, IDPs, and asylum seekers', 'Chain, step, and guest worker migration'] },
      { id: '2.12', name: 'Effects of Migration', concepts: ['Political, economic, and cultural impacts'] }
    ]
  },
  { 
    id: 3, 
    title: 'Unit 3: Cultural Patterns and Processes', 
    videoUrl: getVideoUrlForUnit(3), 
    description: 'Focus on cultural patterns that create recognized identities.',
    topics: [
      { id: '3.1', name: 'Introduction to Culture', concepts: ['Shared practices, technologies, and behaviors', 'Relativism vs. ethnocentrism'] },
      { id: '3.2', name: 'Cultural Landscapes', concepts: ['Physical features and industrial/agricultural practices', 'Sequent occupancy'] },
      { id: '3.3', name: 'Cultural Patterns', concepts: ['Language, religion, and ethnicity patterns', 'Centripetal and centrifugal forces'] },
      { id: '3.4', name: 'Types of Diffusion', concepts: ['Relocation and expansion diffusion', 'Contagious, hierarchical, and stimulus'] },
      { id: '3.5', name: 'Historical Causes of Diffusion', concepts: ['Colonialism, imperialism, and trade', 'Creolization and lingua franca'] },
      { id: '3.6', name: 'Contemporary Causes of Diffusion', concepts: ['Globalization, urbanization, and media', 'Time-space convergence'] },
      { id: '3.7', name: 'Diffusion of Religion and Language', concepts: ['Language families and cultural hearths', 'Universalizing vs. ethnic religions'] },
      { id: '3.8', name: 'Effects of Diffusion', concepts: ['Acculturation, assimilation, and syncretism', 'Multiculturalism'] }
    ]
  },
  { 
    id: 4, 
    title: 'Unit 4: Political Patterns and Processes', 
    videoUrl: getVideoUrlForUnit(4), 
    description: 'Explore the political organization of the world.',
    topics: [
      { id: '4.1', name: 'Introduction to Political Geography', concepts: ['Independent states, nations, and nation-states', 'Stateless nations and autonomous regions'] },
      { id: '4.2', name: 'Political Processes', concepts: ['Sovereignty, self-determination, and devolution'] },
      { id: '4.3', name: 'Political Power and Territoriality', concepts: ['Neocolonialism, shatterbelts, and choke points'] },
      { id: '4.4', name: 'Defining Political Boundaries', concepts: ['Relic, superimposed, subsequent, and antecedent', 'Geometric and consequent boundaries'] },
      { id: '4.5', name: 'Function of Political Boundaries', concepts: ['UNCLOS (Law of the Sea)', 'Exclusive Economic Zones (EEZ)'] },
      { id: '4.6', name: 'Internal Boundaries', concepts: ['Voting districts, redistricting, and gerrymandering'] },
      { id: '4.7', name: 'Forms of Governance', concepts: ['Unitary vs. federal states'] },
      { id: '4.8', name: 'Defining Devolutionary Factors', concepts: ['Physical geography, ethnic separatism, and terrorism'] },
      { id: '4.9', name: 'Challenges to Sovereignty', concepts: ['Supranationalism (UN, NATO, EU, ASEAN, etc.)', 'Democratization'] },
      { id: '4.10', name: 'Centrifugal and Centripetal Forces', concepts: ['Failed states vs. ethnonationalism', 'Cultural cohesion'] }
    ]
  },
  { 
    id: 5, 
    title: 'Unit 5: Agriculture and Rural Land-Use Patterns and Processes', 
    videoUrl: getVideoUrlForUnit(5), 
    description: 'Investigate the origins and evolution of agriculture.',
    topics: [
      { id: '5.1', name: 'Introduction to Agriculture', concepts: ['Intensive vs. extensive farming', 'Mediterranean and tropical climates'] },
      { id: '5.2', name: 'Settlement Patterns and Survey Methods', concepts: ['Clustered, dispersed, and linear', 'Metes and bounds, township and range, long lot'] },
      { id: '5.3', name: 'Agricultural Origins and Diffusions', concepts: ['Hearths of domestication', 'The Columbian Exchange'] },
      { id: '5.4', name: 'The Second Agricultural Revolution', concepts: ['Mechanization and increased food production'] },
      { id: '5.5', name: 'The Green Revolution', concepts: ['High-yield seeds and chemicals', 'Positive and negative consequences'] },
      { id: '5.6', name: 'Agricultural Production Regions', concepts: ['Subsistence vs. commercial practices', 'Bid-rent theory'] },
      { id: '5.7', name: 'Spatial Organization of Agriculture', concepts: ['Agribusiness and complex commodity chains', 'Economies of scale'] },
      { id: '5.8', name: 'Von Thünen Model', concepts: ['Transportation costs and distance from market'] },
      { id: '5.9', name: 'The Global System of Agriculture', concepts: ['Global supply chains and world trade patterns', 'Dependency on export commodities'] },
      { id: '5.10', name: 'Consequences of Agricultural Practices', concepts: ['Desertification, soil salinization, and pollution', 'Landscape alteration (slash and burn, terraces)'] },
      { id: '5.11', name: 'Challenges of Contemporary Agriculture', concepts: ['GMOs, urban farming, and CSA', 'Food insecurity and food deserts'] },
      { id: '5.12', name: 'Women in Agriculture', concepts: ['Changing roles in food production and distribution'] }
    ]
  },
  { 
    id: 6, 
    title: 'Unit 6: Cities and Urban Land-Use Patterns and Processes', 
    videoUrl: getVideoUrlForUnit(6), 
    description: 'Address the origins and challenges of urban settlements.',
    topics: [
      { id: '6.1', name: 'The Origin and Influences of Urbanization', concepts: ['Site and situation', 'Site influences on function and growth'] },
      { id: '6.2', name: 'Cities Across the World', concepts: ['Megacities and metacities', 'Edge cities, exurbs, and boomburbs'] },
      { id: '6.3', name: 'Cities and Globalization', concepts: ['World cities and global connectivity'] },
      { id: '6.4', name: 'The Size and Distribution of Cities', concepts: ['Rank-size rule and primate cities', 'Gravity model and central place theory'] },
      { id: '6.5', name: 'The Internal Structure of Cities', concepts: ['Burgess, Hoyt, and Harris-Ullman models', 'Galactic city and bid-rent theory'] },
      { id: '6.6', name: 'Density and Land Use', concepts: ['Residential building patterns', 'Cycles of development'] },
      { id: '6.7', name: 'Infrastructure', concepts: ['Quality of infrastructure and development patterns'] },
      { id: '6.8', name: 'Urban Sustainability', concepts: ['New Urbanism, smart growth, and greenbelts'] },
      { id: '6.9', name: 'Urban Data', concepts: ['Quantitative (census) vs. qualitative (narratives) data'] },
      { id: '6.10', name: 'Challenges of Urban Changes', concepts: ['Redlining, blockbusting, and gentrification', 'Squatter settlements and disamenity zones'] },
      { id: '6.11', name: 'Challenges of Urban Sustainability', concepts: ['Sprawl, sanitation, and climate change'] }
    ]
  },
  { 
    id: 7, 
    title: 'Unit 7: Industrial and Economic Development Patterns and Processes', 
    videoUrl: getVideoUrlForUnit(7), 
    description: 'Understand the origins and role of industry in global development.',
    topics: [
      { id: '7.1', name: 'The Industrial Revolution', concepts: ['New technologies and natural resources', 'Urbanization and class structure changes'] },
      { id: '7.2', name: 'Economic Sectors and Patterns', concepts: ['Primary, secondary, tertiary, quaternary, and quinary', 'Core-periphery relationships'] },
      { id: '7.3', name: 'Measures of Development', concepts: ['GDP, GNP, and GNI per capita', 'Human Development Index (HDI)', 'Gender Inequality Index (GII)'] },
      { id: '7.4', name: 'Women and Economic Development', concepts: ['Gender parity and equity', 'Role of microloans'] },
      { id: '7.5', name: 'Theories of Development', concepts: ["Rostow's Stages and Wallerstein's World System Theory", 'Dependency theory and commodity dependence'] },
      { id: '7.6', name: 'Trade and the World Economy', concepts: ['Complementarity and comparative advantage', 'Neoliberal policies (EU, WTO, OPEC)'] },
      { id: '7.7', name: 'Changes as a Result of the World Economy', concepts: ['Outsourcing and SEZs', 'Post-Fordist methods and just-in-time delivery'] },
      { id: '7.8', name: 'Sustainable Development', concepts: ['UN Sustainable Development Goals (SDGs)', 'Ecotourism'] }
    ]
  }
];

function App() {
  const [currentUnit, setCurrentUnit] = useState<Unit>(units[0]);

  useEffect(() => {
    return startAnalytics();
  }, []);

  const handleSelectUnit = (unit: Unit) => {
    trackUnitSelect(unit.id, unit.title);
    setCurrentUnit(unit);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-titles">
          <h1>MorReview: APHUG Unit Review</h1>
          <p>Educational framework from College Board AP® Human Geography CED</p>
        </div>
      </header>
      <div className="main-content">
        <Sidebar units={units} currentUnitId={currentUnit.id} onSelectUnit={handleSelectUnit} />
        <main className="video-area">
          <VideoPlayer unit={currentUnit} />
        </main>
      </div>
    </div>
  )
}

export default App
