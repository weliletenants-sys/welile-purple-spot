export interface DailyPayment {
  date: string;
  amount: number;
  paid: boolean;
  paidAmount?: number;
  recordedBy?: string;
  recordedAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

export interface Guarantor {
  name: string;
  contact: string;
}

export interface Location {
  country: string;
  county: string;
  district: string;
  subcountyOrWard: string;
  cellOrVillage: string;
}

export interface Tenant {
  id: string;
  name: string;
  contact: string;
  address: string;
  status: 'active' | 'pending' | 'review' | 'cleared' | 'overdue';
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'cleared';
  performance: number;
  landlord: string;
  landlordContact: string;
  rentAmount: number;
  repaymentDays: 30 | 60 | 90;
  dailyPayments: DailyPayment[];
  guarantor1?: Guarantor;
  guarantor2?: Guarantor;
  location?: Location;
}

const generateDailyPayments = (days: number): DailyPayment[] => {
  const payments: DailyPayment[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    payments.push({
      date: date.toISOString().split('T')[0],
      amount: 0,
      paid: false,
    });
  }
  return payments;
};

// Helper function to assign random repayment days
const getRandomDays = (): 30 | 60 | 90 => {
  const options = [30, 60, 90];
  return options[Math.floor(Math.random() * options.length)] as 30 | 60 | 90;
};

export const tenants: Tenant[] = [
  { id: '1', name: 'BASHIR KAWEMPE', contact: '0787992676', landlord: 'ALEX NAMUTEBI', landlordContact: '0752525200', address: 'Kawempe', status: 'active', paymentStatus: 'paid', performance: 93, rentAmount: 1500000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '2', name: 'Kabuleta Seyid', contact: '759189181', landlord: 'Makumbi Halid', landlordContact: '708045695', address: 'Bunamwaya', status: 'cleared', paymentStatus: 'cleared', performance: 97, rentAmount: 400000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '3', name: 'Nalugya Amina', contact: '775566621', landlord: 'Nakaweesi Annet', landlordContact: '755406768', address: 'Kawuku', status: 'cleared', paymentStatus: 'cleared', performance: 96, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '4', name: 'Nawannungi Joyce Nalukwago', contact: '701220056', landlord: 'Nalongo Nalukwago', landlordContact: '752896181', address: 'Kawuku', status: 'active', paymentStatus: 'paid', performance: 92, rentAmount: 250000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '5', name: 'Nalongo Nalukwago', contact: '7059029111', landlord: 'Nalongo Nalukwago', landlordContact: '752896181', address: 'Kawuku', status: 'cleared', paymentStatus: 'cleared', performance: 95, rentAmount: 150000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '6', name: 'Nalubwama Florence', contact: '773878009', landlord: 'Namugalu', landlordContact: '701011231', address: 'Kibanga', status: 'cleared', paymentStatus: 'cleared', performance: 94, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '7', name: 'Mulega Jackie', contact: '750375887', landlord: 'Nakayima Faith', landlordContact: '742485502', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 200000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '8', name: 'Mbuga Mariam', contact: '753768813', landlord: 'Waiswa', landlordContact: '707169911', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 89, rentAmount: 300000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '9', name: 'Nalukwago Zahara', contact: '702883606', landlord: 'Mukokoma Scovia', landlordContact: '701836856', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 98, rentAmount: 250000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '10', name: 'Nalunkuma Justin', contact: '759648561', landlord: 'Nabosa Scovia', landlordContact: '743375669', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 93, rentAmount: 400000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '11', name: 'Najjingo Aisha', contact: '756137690', landlord: 'Mukisa Faith', landlordContact: '745135321', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 94, rentAmount: 180000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '12', name: 'Kasimaggwa Jamil Muhammad', contact: '747014156', landlord: 'Allan Sentongo', landlordContact: '709105519', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 200000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '13', name: 'Mwanje Ibra', contact: '701234524', landlord: 'Kisubi Diana', landlordContact: '770527306', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 95, rentAmount: 300000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '14', name: 'Nalubega Peninah', contact: '700877060', landlord: 'Nakazibwe Betty', landlordContact: '755406768', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 400000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '15', name: 'Nakiyana Scovia', contact: '702606966', landlord: 'Kabuga Brian', landlordContact: '762518508', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 91, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '16', name: 'Nanteza Joyce', contact: '754197205', landlord: 'Nabuumba Solome', landlordContact: '772486073', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88, rentAmount: 300000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '17', name: 'Balikanda Andrew', contact: '740841609', landlord: 'Richard Kawungu', landlordContact: '752660257', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 97, rentAmount: 100000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '18', name: 'Catherine Joyce Aneno', contact: '702046578', landlord: 'Nakachwa Elizabeth', landlordContact: '701959210', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 98, rentAmount: 400000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '19', name: 'Nalumu Zaituni', contact: '706257607', landlord: 'Aneno Beatrice', landlordContact: '773084995', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 94, rentAmount: 400000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '20', name: 'Bogere Zakaliya', contact: '787037630', landlord: 'Mugulumu', landlordContact: '774033851', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 96, rentAmount: 150000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '21', name: 'Kyaterekera Tom', contact: '708019355', landlord: 'Papa Halima', landlordContact: '705392134', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 92, rentAmount: 80000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '22', name: 'Nagawa Jollin', contact: '744103043', landlord: 'Kempisi Zubeda', landlordContact: '700196471', address: 'Kiwafu', status: 'cleared', paymentStatus: 'cleared', performance: 95, rentAmount: 80000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '23', name: 'Nabasumba Juliet', contact: '709819237', landlord: 'Nabihogo Oliver', landlordContact: '708215368', address: 'Lugonjo', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 150000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '24', name: 'Kiyingi Abdul', contact: '769156574', landlord: 'Lubega Shafic', landlordContact: '701856117', address: 'Lyamutundwe', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '25', name: 'Juuko Paul', contact: '702273378', landlord: 'Lubega Shafic', landlordContact: '701856117', address: 'Lyamutundwe', status: 'cleared', paymentStatus: 'cleared', performance: 93, rentAmount: 150000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '26', name: 'Ndagire Sumayiyah Bilali', contact: '769037562', landlord: 'Najjuma Sharifah', landlordContact: '705027272', address: 'Makindye', status: 'active', paymentStatus: 'paid', performance: 90, rentAmount: 200000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '27', name: 'Irachan Pia', contact: '0757676945', landlord: 'Ogine Mungu', landlordContact: '765866525', address: 'Manyango', status: 'overdue', paymentStatus: 'overdue', performance: 69, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '28', name: 'Lukwago Ibrahim', contact: '704815621', landlord: 'Mumbeja', landlordContact: '751394121', address: 'Mpala', status: 'cleared', paymentStatus: 'cleared', performance: 94, rentAmount: 120000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '29', name: 'Mwesigye Peter', contact: '702785238', landlord: 'Kafuuma Jack', landlordContact: '706529191', address: 'Mpala', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 600000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '30', name: 'Dafin Nayebare', contact: '759839432', landlord: 'Salongo Kate', landlordContact: '753001143', address: 'Nakiwogo', status: 'cleared', paymentStatus: 'cleared', performance: 96, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '31', name: 'Shallot Amutuhaire', contact: '741904737', landlord: 'Nakabugo Florence', landlordContact: '751612906', address: 'Nakiwogo', status: 'active', paymentStatus: 'paid', performance: 87, rentAmount: 180000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '32', name: 'Higenyi Robert', contact: '0703458843', landlord: 'Migadde Simon', landlordContact: '758257049', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 67, rentAmount: 150000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '33', name: 'Nakanwagi Lydia', contact: '708206856', landlord: 'Nabulya Irene', landlordContact: '700305227', address: 'Nkumba', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 90000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '34', name: 'Asiimwe Alex', contact: '770432534', landlord: 'Miiro Prossy', landlordContact: '702240576', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 93, rentAmount: 300000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '35', name: 'Naluwugge Juliet', contact: '741404687', landlord: 'Kusaba Sylvia', landlordContact: '744231104', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 75, rentAmount: 200000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '36', name: 'Wanyeze Christine', contact: '754715140', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 85, rentAmount: 190000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '37', name: 'Nalongo Babirye', contact: '7767148822', landlord: 'Nanteza', landlordContact: '752998767', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 400000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '38', name: 'Nuwahereza Doreen', contact: '748805116', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'pending', performance: 82, rentAmount: 220000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '39', name: 'Nalumansi Marium', contact: '705472340', landlord: 'Busingye Fred', landlordContact: '745019496', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '40', name: 'Nakanwagi Sarah', contact: '700806134', landlord: 'Nakalemba Maria', landlordContact: '747463903', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 400000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '41', name: 'Ninsiima Emmanuel', contact: '0786323161', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88, rentAmount: 240000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '42', name: 'Kirangwa Ian', contact: '753475536', landlord: 'Dan Kawele', landlordContact: '752616373', address: 'Kabona', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 400000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '43', name: 'Nakijoba Zulfah', contact: '742633830', landlord: 'Nansubuga Alice', landlordContact: '753369167', address: 'Nalugala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 200000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '44', name: 'Namulindwa Rebeccah', contact: '0701355816', landlord: 'Nabuufu Jackie', landlordContact: '703120075', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '45', name: 'Kwagalakwe Damali', contact: '7731673371', landlord: 'Kigereigu Fred', landlordContact: '7525502707', address: 'Kawafu', status: 'overdue', paymentStatus: 'overdue', performance: 69, rentAmount: 639000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '46', name: 'Twesigye Moses', contact: '754524425', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 86, rentAmount: 200000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '47', name: 'Nakajigo Olivia', contact: '755382271', landlord: 'John Muhanja', landlordContact: '775889828', address: 'Nalugala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 300000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '48', name: 'Mugala Amina', contact: '750814143', landlord: 'Henry', landlordContact: '740963489', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '49', name: 'Ainemukama Micheal', contact: '747419808', landlord: 'Rose Bogere', landlordContact: '701355839', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 68, rentAmount: 160000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '50', name: 'Nabiffo Pauline', contact: '790273460', landlord: 'Nakayiza Grace', landlordContact: '745618863', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 91, rentAmount: 600000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '51', name: 'Byaruhanga Wilson', contact: '0781269387', landlord: 'Katungye Apollo', landlordContact: '764564413', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 400000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '52', name: 'Kakooza Henry', contact: '750440078', landlord: 'Ssekiziyivu Ronald', landlordContact: '753245528', address: 'Kawafu', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 100000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '53', name: 'Luzinda Sam', contact: '705929889', landlord: 'Lule Patric', landlordContact: '755681118', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 100000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '54', name: 'Besigye Norman', contact: '0781974026', landlord: 'Kadoozi Patrick', landlordContact: '0779021740', address: 'Kabona', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 120000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '55', name: 'Birungi Joan', contact: '751433725', landlord: 'Ziriyo Fred', landlordContact: '750978235', address: 'Nalugala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '56', name: 'Nakimera Esther', contact: '744032727', landlord: 'Nalinda Jalia', landlordContact: '744763131', address: 'Kakindu', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 400000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '57', name: 'Ssebuliba Wcyliff', contact: '703090804', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 87, rentAmount: 210000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '58', name: 'Lugolobi Gerald', contact: '708901461', landlord: 'Namata Ritah', landlordContact: '755545237', address: 'Katabi', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 200000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '59', name: 'Setenda Angella', contact: '750333725', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 89, rentAmount: 190000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '60', name: 'Matovu Regan', contact: '70585965', landlord: 'Nakanwagi Grace', landlordContact: '780249986', address: 'Bulega', status: 'overdue', paymentStatus: 'overdue', performance: 75, rentAmount: 240000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '61', name: 'Natukunda Tracy', contact: '785129426', landlord: 'Kakeeto Emmanuel', landlordContact: '758974792', address: 'Garuga', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 230000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '62', name: 'Nakazi Rebecca', contact: '709728452', landlord: 'Nanteza Teopista', landlordContact: '704529651', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 200000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '63', name: 'Ndyamuhaki Mercy', contact: '708385458', landlord: 'N/A', landlordContact: 'N/A', address: 'Katabi', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 410000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '64', name: 'Samanya Zainab', contact: '756640734', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88, rentAmount: 250000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '65', name: 'Abiro Hasfah', contact: '781982498', landlord: 'Jamal', landlordContact: '709459171', address: 'Kitubulu', status: 'active', paymentStatus: 'paid', performance: 91, rentAmount: 300000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '66', name: 'Aciro Rose', contact: '745161048', landlord: 'Oyam Derrick', landlordContact: '705071449', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 69, rentAmount: 300000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '67', name: 'Ahimbisibwe Ronald', contact: '752601725', landlord: 'Hope Bainimugasho', landlordContact: '740259097', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 400000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
  { id: '68', name: 'Aida Naigaga', contact: '705468841', landlord: 'Kasozi Edward', landlordContact: '753182760', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 68, rentAmount: 140000, repaymentDays: 90, dailyPayments: generateDailyPayments(90) },
  { id: '69', name: 'Aisha Pauline', contact: '704453861', landlord: 'Albert Mapendi', landlordContact: '704453861', address: 'Kitubulu', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 100000, repaymentDays: 30, dailyPayments: generateDailyPayments(30) },
  { id: '70', name: 'Akumu Margret', contact: '745161048', landlord: 'Lubanga', landlordContact: '777589543', address: 'Lugonjo', status: 'overdue', paymentStatus: 'overdue', performance: 67, rentAmount: 100000, repaymentDays: 60, dailyPayments: generateDailyPayments(60) },
];

export const TOTAL_TENANT_COUNT = 40000000;

export const generatePerformanceScore = (status: string, paymentStatus: string): number => {
  if (status === 'cleared' && paymentStatus === 'cleared') return Math.floor(Math.random() * 10) + 90;
  if (status === 'active' && paymentStatus === 'paid') return Math.floor(Math.random() * 15) + 80;
  if (status === 'overdue' || paymentStatus === 'overdue') return Math.floor(Math.random() * 15) + 65;
  return Math.floor(Math.random() * 20) + 70;
};

// Calculate total repayment amount including fees and access charges
export const calculateRepaymentDetails = (rentAmount: number, repaymentDays: number) => {
  const registrationFee = rentAmount <= 2000000 ? 10000 : 200000;
  const months = repaymentDays / 30;
  const accessFeeRate = 0.33;
  const accessFees = rentAmount * (Math.pow(1 + accessFeeRate, months) - 1);
  const totalAmount = rentAmount + registrationFee + accessFees;
  const dailyInstallment = totalAmount / repaymentDays;

  return {
    rentAmount,
    registrationFee,
    accessFees: Math.round(accessFees),
    totalAmount: Math.round(totalAmount),
    dailyInstallment: Math.round(dailyInstallment),
    repaymentDays,
  };
};
