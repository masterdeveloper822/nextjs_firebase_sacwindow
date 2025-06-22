
export type UserRole = 'attendant' | 'administrator' | 'ti' | 'sac' | 'finance' | 'operation' | 'logistics';

export interface User {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role: UserRole;
  isActive?: boolean; // Added for user management
  photoURL?: string; // Added for avatar
}

export interface ClientConsumptionData {
  currentQuarterBilling: number;
  previousQuarterBilling: number;
  currentQuarterDates: string;
  previousQuarterDates: string;
  windowBlue: {
    previousTrimester: { meters: number; total: number };
    currentTrimester: { meters: number; total: number };
  };
  ppf: {
    previousTrimester: { meters: number; total: number };
    currentTrimester: { meters: number; total: number };
  };
}

export interface ComodatoItem {
  id: string;
  itemId: string;
  description: string;
  patrimonyNo: string;
  quantity: number;
  sendDate: string; // ISO string
  returnDate?: string; // ISO string
}

export interface Client {
  id: string;
  name: string; // Razão Social
  fantasyName?: string; // Nome Fantasia
  code: string;
  cnpjCpf: string;
  email: string;
  phone: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string; // UF
  internalSalesperson?: { code: string; name: string }; // Codusur1 + Nome
  externalSalesperson?: { code: string; name: string }; // Codusur2 + Nome
  registrationDate?: string; // ISO string
  activeMonths?: number;
  manifestationCount?: number;
  consumptionData?: ClientConsumptionData;
  comodatos?: ComodatoItem[];
}

export interface OrderItem {
  id: string;
  orderNo?: string; // Added to easily identify parent order
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalItem: number;
  lot?: string;
  labelNo?: string; // Número da etiqueta
}

export interface Order {
  id: string;
  clientId: string;
  branchNo: string; // Nº da Filial
  orderNo: string; // Nº do Pedido
  invoiceNo?: string; // Nota Fiscal
  date: string; // ISO string
  totalValue: number;
  items: OrderItem[];
  clientName?: string; // Denormalized
  salespersonIssuer?: string; // Vendedor emissor
  paymentMethod?: string; // Forma de pagamento
  deliveryType?: string; // Tipo de entrega
  deliveryDate?: string; // Data entrega - ISO String
  separatorName?: string; // Nome do separador
  checkerName?: string; // Nome do conferente
  deliveryPersonName?: string; // Nome do entregador
}

export type ManifestationStatus = 'resolved' | 'pending' | 'analyzing' | 'overdue' | 'not_analyzed';

export interface ManifestationAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
}

export interface ManifestationHistoryLog {
  id: string;
  timestamp: string; // ISO string
  action: string;
  userId: string;
  userName: string;
  details?: string; // Optional for more info in modal
}

export interface ProductForReturn {
  id?: string;
  orderNo: string;
  productId: string;
  productName: string;
  quantityAcquired?: number;
  quantityToReturn: number;
  labelNo: string;
  labelQuantity: number;
}

export interface OperationReceivedItem {
  id?: string; // For useFieldArray key
  productId: string;
  productName: string;
  labelNo: string;
  labelQuantitySac: number; // Qtd. da etiqueta informada pelo SAC
  quantityReturnedSac: number; // Qtd. devolvida informada pelo SAC
  receivedCorrectly: 'yes' | 'no' | 'partial' | '';
  quantityToStock: number;
  quantityToDiscard: number;
  operationNotes?: string;
}

export type AuditComplianceLevel = 'not_evaluated' | 'none' | 'low' | 'medium' | 'high';


export interface Manifestation {
  id:string;
  manifestationNo: string;
  clientId: string;
  clientName: string; // Denormalized
  branch: string; // Filial
  type: string; // Tipo de manifestação (e.g., complaint, suggestion, query)
  openingDate: string; // ISO string
  status: ManifestationStatus;
  attendantId?: string;
  attendantName?: string; // Denormalized
  reason?: string; // Motivo (from parameters)
  description: string;
  attachments: ManifestationAttachment[];
  attendantTypedOpinion?: string; // Parecer do atendente (typed text)
  attendantOpinion?: string; // Parecer do atendente (single selection from radio)
  recommendedAction?: string; // Ação recomendada (single selection from parameters)
  collectionType?: string; // Tipo de coleta (from parameters)
  collectionScheduledCarrier?: string;
  collectionReturnInvoice?: string;
  collectionScheduledDate?: string; // ISO string
  collectionScheduledPeriod?: 'morning' | 'afternoon' | '';
  collectionScheduledNotes?: string;
  collectionReceiptUrl?: string; // URL for the collection receipt
  slaDueDate?: string; // ISO string
  history: ManifestationHistoryLog[];
  productsForReturn?: ProductForReturn[];
  comodatos?: ComodatoItem[];
  // Credit Details
  creditGranted?: 'yes' | 'no';
  creditReasonAttendant?: string;
  creditProofAttendantUrl?: string;
  creditStatusFinance?: 'approved' | 'rejected' | 'pending';
  creditReasonFinance?: string;
  // Operation (Stock) Section
  operationReceivedItems?: OperationReceivedItem[];
  operationProofUrls?: string[]; // URLs for operation proofs
  operationOpinion?: string;
  // Audit Section
  auditOpinion?: string;
  auditAttachmentUrls?: string[];
  auditComplianceLevel?: AuditComplianceLevel;
  // Pre-Opening Details
  preOpeningSummary?: string;
  preOpeningUserId?: string;
  preOpeningUserName?: string;
  preOpeningTimestamp?: string; // ISO string
}


export type ParameterType = 'reason' | 'recommendedAction' | 'collectionType' | 'actionButton' | 'attendantOpinionOption' | 'userRole';

export interface ParameterItem {
  id: string;
  name: string;
  type: ParameterType;
  isActive: boolean;
}

export type DatabaseType = 'oracle' | 'postgres' | 'mysql';

export interface BaseConnectionParams {
  dbType: DatabaseType;
  host: string;
  port: number;
  username: string;
  password?: string;
}

export interface OracleSpecificParams {
  connectionType: 'sid' | 'serviceName';
  identifier: string;
}

export interface PostgresMySqlSpecificParams {
  databaseName: string;
}

export type DatabaseConnectionParams = BaseConnectionParams & Partial<OracleSpecificParams> & Partial<PostgresMySqlSpecificParams>;


export interface DynamicFieldMapping {
  id: string;
  applicationField: string;
  description: string;
  oracleTable: string;
  oracleValueColumn: string;
  oracleDisplayColumn: string;
  isActive: boolean;
}

// --- Static Dates for Mock Data ---
const staticToday = new Date().toISOString();
const staticYesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
const staticTwoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const staticFiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
const staticPlusTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const staticPlusThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();


export const mockClients: Client[] = [
  {
    id: 'client1', name: 'Empresa Alpha Ltda.', fantasyName: 'Alpha Soluções', code: 'C001', cnpjCpf: '12.345.678/0001-99', email: 'contact@alpha.com', phone: '(11) 98765-4321',
    address: 'Av. Principal, 123, Sala 4B', zipCode: '01000-000', city: 'São Paulo', state: 'SP',
    internalSalesperson: { code: 'V001', name: 'Ana Julia'}, externalSalesperson: { code: 'E001', name: 'Marcos Silva'},
    registrationDate: "2020-01-15T00:00:00.000Z", activeMonths: 48, manifestationCount: 5,
    consumptionData: {
      currentQuarterBilling: 115580.32,
      previousQuarterBilling: 104894.57,
      currentQuarterDates: "28/02/2025 ATÉ 29/05/2025",
      previousQuarterDates: "30/11/2024 ATÉ 27/02/2025",
      windowBlue: {
        previousTrimester: { meters: 1332, total: 2000 },
        currentTrimester: { meters: 1471, total: 2000 },
      },
      ppf: {
        previousTrimester: { meters: 850, total: 1500 },
        currentTrimester: { meters: 920, total: 1500 },
      },
    },
    comodatos: [
        { id: 'como1-1', itemId: 'EQP001', description: 'Máquina de Aplicação XPTO-500', patrimonyNo: 'PAT778899', quantity: 1, sendDate: "2022-06-01T00:00:00.000Z", returnDate: "2024-06-01T00:00:00.000Z" },
        { id: 'como1-2', itemId: 'EQP002', description: 'Dispensador de Película Automático', patrimonyNo: 'PAT778900', quantity: 2, sendDate: "2023-01-10T00:00:00.000Z" },
    ]
  },
  {
    id: 'client2', name: 'João Silva Restaurante ME', fantasyName: 'Restaurante Sabor da Terra', code: 'C002', cnpjCpf: '123.456.789-00', email: 'joao.silva@email.com', phone: '(21) 91234-5678',
    address: 'Rua das Palmeiras, 45', zipCode: '20000-000', city: 'Rio de Janeiro', state: 'RJ',
    internalSalesperson: { code: 'V002', name: 'Beatriz Costa'}, externalSalesperson: { code: 'E002', name: 'Carlos Andrade'},
    registrationDate: "2022-06-10T00:00:00.000Z", activeMonths: 20, manifestationCount: 2,
    consumptionData: {
      currentQuarterBilling: 75000.00,
      previousQuarterBilling: 68000.00,
      currentQuarterDates: "01/03/2025 ATÉ 31/05/2025",
      previousQuarterDates: "01/12/2024 ATÉ 28/02/2025",
      windowBlue: {
        previousTrimester: { meters: 900, total: 1800 },
        currentTrimester: { meters: 1050, total: 1800 },
      },
      ppf: {
        previousTrimester: { meters: 500, total: 1000 },
        currentTrimester: { meters: 620, total: 1000 },
      },
    }
  },
  {
    id: 'client3', name: 'BlueTech Films Produções Cinematográficas Ltda.', fantasyName: 'BlueTech Films', code: '165', cnpjCpf: '98.765.432/0001-11', email: 'contato@bluetechfilms.com', phone: '(41) 99999-8888',
    address: 'Alameda dos Anjos, 777, Bloco Z', zipCode: '80000-000', city: 'Curitiba', state: 'PR',
    internalSalesperson: { code: 'V003', name: 'Lucas Martins'}, externalSalesperson: { code: 'E003', name: 'Fernanda Lima'},
    registrationDate: "2018-09-01T00:00:00.000Z", activeMonths: 66, manifestationCount: 1,
    consumptionData: {
      currentQuarterBilling: 250000.50,
      previousQuarterBilling: 230000.75,
      currentQuarterDates: "15/02/2025 ATÉ 14/05/2025",
      previousQuarterDates: "15/11/2024 ATÉ 14/02/2025",
      windowBlue: {
        previousTrimester: { meters: 2200, total: 3000 },
        currentTrimester: { meters: 2500, total: 3000 },
      },
      ppf: {
        previousTrimester: { meters: 1500, total: 2000 },
        currentTrimester: { meters: 1750, total: 2000 },
      },
    },
    comodatos: [
        { id: 'como3-1', itemId: 'CAM001', description: 'Câmera Profissional UltraHD', patrimonyNo: 'PAT990011', quantity: 1, sendDate: "2023-03-15T00:00:00.000Z" },
    ]
  },
];

export const mockOrders: Order[] = [
  { id: 'order1', clientId: 'client1', clientName: 'Empresa Alpha Ltda.', branchNo: 'FIL01', orderNo: 'PED001', invoiceNo: 'NF001', date: "2023-11-01T00:00:00.000Z", totalValue: 1500.00, items: [
    { id: 'item1_1', orderNo: 'PED001', productId: 'PROD_A', description: 'Produto A Super Premium', quantity: 2, unitPrice: 500, totalItem: 1000, lot: 'LOTE001A', labelNo: 'ETQ001' },
    { id: 'item1_2', orderNo: 'PED001', productId: 'PROD_B', description: 'Produto B Essencial', quantity: 1, unitPrice: 500, totalItem: 500, labelNo: 'ETQ002' },
  ], salespersonIssuer: 'Ana Julia', paymentMethod: 'Boleto 30d', deliveryType: 'Transportadora XPTO', deliveryDate: "2023-11-05T00:00:00.000Z", separatorName: 'José Couves', checkerName: 'Maria Abadia', deliveryPersonName: 'Antônio Fretes' },
  { id: 'order2', clientId: 'client1', clientName: 'Empresa Alpha Ltda.', branchNo: 'FIL01', orderNo: 'PED002', invoiceNo: 'NF002', date: "2023-11-15T00:00:00.000Z", totalValue: 750.00, items: [
    { id: 'item2_1', orderNo: 'PED002', productId: 'PROD_C', description: 'Produto C Standard', quantity: 5, unitPrice: 150, totalItem: 750, labelNo: 'ETQ003' },
  ], salespersonIssuer: 'Ana Julia', paymentMethod: 'Cartão Crédito 1x', deliveryType: 'Retira Cliente', deliveryDate: "2023-11-16T00:00:00.000Z", separatorName: 'José Couves', checkerName: 'Maria Abadia', deliveryPersonName: 'N/A (Retira)' },
  { id: 'order3', clientId: 'client2', clientName: 'João Silva Restaurante ME', branchNo: 'FIL02', orderNo: 'PED003', invoiceNo: 'NF003', date: "2023-12-05T00:00:00.000Z", totalValue: 300.00, items: [
    { id: 'item3_1', orderNo: 'PED003', productId: 'PROD_D', description: 'Produto D Básico', quantity: 3, unitPrice: 100, totalItem: 300, lot: 'LOTE002D', labelNo: 'ETQ004' },
  ], salespersonIssuer: 'Beatriz Costa', paymentMethod: 'PIX', deliveryType: 'Motoboy', deliveryDate: "2023-12-05T00:00:00.000Z", separatorName: 'Carlos Silva', checkerName: 'Fernanda Dias', deliveryPersonName: 'Pedro Motos' },
  { id: 'order4', clientId: 'client3', clientName: 'BlueTech Films Produções Cinematográficas Ltda.', branchNo: 'FIL03', orderNo: 'PED004', invoiceNo: 'NF004', date: "2024-01-10T00:00:00.000Z", totalValue: 2500.00, items: [
    { id: 'item4_1', orderNo: 'PED004', productId: 'PROD_E', description: 'Filme Especial Edição Colecionador', quantity: 1, unitPrice: 2500, totalItem: 2500, lot: 'LOTE_FILM_001', labelNo: 'ETQ005' },
  ], salespersonIssuer: 'Lucas Martins', paymentMethod: 'Boleto 15d', deliveryType: 'Transportadora ZAP', deliveryDate: "2024-01-15T00:00:00.000Z", separatorName: 'Ricardo Neves', checkerName: 'Sofia Almeida', deliveryPersonName: 'Gilmar Fretes Rápidos' },
];


export const mockManifestations: Manifestation[] = [
  {
    id: 'man1', manifestationNo: 'MAN001', clientId: 'client1', clientName: 'Empresa Alpha Ltda.', branch: 'FIL01', type: 'Reclamação',
    openingDate: staticTwoDaysAgo, status: 'pending', attendantId: 'attendant1', attendantName: 'Carlos Pereira',
    description: 'Produto entregue com defeito na embalagem. Necessito de troca urgente.',
    reason: 'Produto Defeituoso',
    attendantTypedOpinion: 'Cliente recebeu o produto com a caixa amassada, aparentemente durante o transporte.',
    attendantOpinion: 'op2', // Corresponde a 'Problema com transportadora'
    recommendedAction: 'Trocar Produto',
    collectionType: 'Coleta Reversa Agendada',
    collectionScheduledCarrier: 'TransLog Rápido',
    collectionReturnInvoice: 'RTN-001-MAN001',
    collectionScheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    collectionScheduledPeriod: 'afternoon',
    collectionScheduledNotes: 'Coletar entre 14h e 17h. Procurar por Sr. Antônio.',
    collectionReceiptUrl: 'https://placehold.co/300x200.png?text=ReciboColetaMAN001',
    slaDueDate: staticPlusTwoDays,
    attachments: [], history: [
        {id: 'hist1', timestamp: staticTwoDaysAgo, action: 'Manifestação aberta', userId: 'client1', userName: 'Empresa Alpha Ltda.', details: 'Cliente abriu a manifestação pelo portal.'},
        {id: 'hist1.1', timestamp: staticTwoDaysAgo, action: 'Triagem inicial', userId: 'system', userName: 'Sistema', details: 'Manifestação encaminhada para o atendente Carlos Pereira.'},
    ],
    productsForReturn: [
      { id: 'pfr1', orderNo: 'PED001', productId: 'PROD_A', productName: 'Produto A Super Premium', quantityAcquired: 2, quantityToReturn: 1, labelNo: 'ETQDEV001', labelQuantity: 1}
    ],
    comodatos: mockClients.find(c => c.id === 'client1')?.comodatos || [],
    creditGranted: 'yes',
    creditReasonAttendant: 'Produto danificado, crédito concedido para próxima compra.',
    creditProofAttendantUrl: 'https://placehold.co/200x100.png',
    creditStatusFinance: 'pending', // <<<< For Finance Page
    creditReasonFinance: '',
    operationReceivedItems: [
      { id: 'opitem1', productId: 'PROD_A', productName: 'Produto A Super Premium', labelNo: 'ETQDEV001', labelQuantitySac: 1, quantityReturnedSac: 1, receivedCorrectly: '', quantityToStock: 0, quantityToDiscard: 0, operationNotes: '' }
    ],
    operationProofUrls: [],
    operationOpinion: '',
    auditOpinion: '',
    auditAttachmentUrls: [],
    auditComplianceLevel: 'not_evaluated',
    preOpeningSummary: 'Cliente informa que o produto PROD_A do pedido PED001 chegou com a embalagem amassada.',
    preOpeningUserId: 'user-commercial-example',
    preOpeningUserName: 'Vendedor Comercial Exemplo',
    preOpeningTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'man2', manifestationNo: 'MAN002', clientId: 'client2', clientName: 'João Silva Restaurante ME', branch: 'FIL02', type: 'Dúvida',
    openingDate: staticYesterday, status: 'analyzing', attendantId: 'attendant2', attendantName: 'Ana Souza',
    description: 'Gostaria de saber mais sobre a política de devolução para produtos perecíveis.',
    reason: 'Informação Produto/Serviço',
    attendantTypedOpinion: 'Cliente com dúvida específica sobre item não coberto pela política padrão.',
    attendantOpinion: 'op3',
    collectionReceiptUrl: '',
    slaDueDate: staticPlusThreeDays,
    attachments: [], history: [{id: 'hist2', timestamp: staticYesterday, action: 'Manifestação aberta', userId: 'client2', userName: 'João Silva Restaurante ME', details: 'Cliente ligou para o SAC.'}],
    comodatos: mockClients.find(c => c.id === 'client2')?.comodatos || [],
    creditStatusFinance: 'pending',
    operationOpinion: '',
    auditOpinion: '',
    auditComplianceLevel: 'not_evaluated',
    // No preOpening data for this one
  },
  {
    id: 'man3', manifestationNo: 'MAN003', clientId: 'client1', clientName: 'Empresa Alpha Ltda.', branch: 'FIL01', type: 'Elogio',
    openingDate: staticToday, status: 'resolved', attendantId: 'attendant1', attendantName: 'Carlos Pereira',
    description: 'Atendimento excelente do vendedor Marcos Silva, muito atencioso e resolveu meu problema rapidamente.',
    reason: 'Atendimento',
    attachments: [], history: [
        {id: 'hist3', timestamp: staticToday, action: 'Manifestação aberta', userId: 'client1', userName: 'Empresa Alpha Ltda.'},
        {id: 'hist4', timestamp: staticToday, action: 'Manifestação resolvida', userId: 'attendant1', userName: 'Carlos Pereira', details: 'Elogio registrado e encaminhado ao gestor do vendedor.'}
    ],
    comodatos: mockClients.find(c => c.id === 'client1')?.comodatos || [],
    creditStatusFinance: 'approved',
    operationReceivedItems: [],
    operationOpinion: 'Não aplicável (Elogio)',
    auditOpinion: 'Elogio registrado. Sem não conformidades.',
    auditComplianceLevel: 'none',
  },
  {
    id: 'man4', manifestationNo: 'MAN004', clientId: 'client3', clientName: 'BlueTech Films Produções Cinematográficas Ltda.', branch: 'FIL03', type: 'Reclamação',
    openingDate: staticFiveDaysAgo, status: 'overdue', attendantId: 'attendant3', attendantName: 'Mariana Lima',
    description: 'Meu pedido PED004 está atrasado há 3 dias da data prevista de entrega.',
    reason: 'Atraso na Entrega',
    attendantTypedOpinion: 'Verificado com a transportadora ZAP, houve um problema logístico na região do cliente.',
    attendantOpinion: 'op2',
    recommendedAction: 'Agilizar Entrega com Transportadora',
    collectionType: 'Entrega Direta com Atraso',
    slaDueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Overdue SLA
    attachments: [], history: [
        {id: 'hist5', timestamp: staticFiveDaysAgo, action: 'Manifestação aberta', userId: 'client3', userName: 'BlueTech Films Produções Cinematográficas Ltda.'},
        {id: 'hist6', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), action: 'Contato com transportadora', userId: 'attendant3', userName: 'Mariana Lima', details: 'Transportadora informou que haveria atraso.'},
    ],
    productsForReturn: [
      { id: 'pfr2', orderNo: 'PED004', productId: 'PROD_E', productName: 'Filme Especial Edição Colecionador', quantityAcquired: 1, quantityToReturn: 1, labelNo: 'ETQDEV002', labelQuantity: 1}
    ],
    comodatos: mockClients.find(c => c.id === 'client3')?.comodatos || [],
    creditGranted: 'no',
    creditStatusFinance: 'rejected',
    operationReceivedItems: [
        { id: 'opitem2', productId: 'PROD_E', productName: 'Filme Especial Edição Colecionador', labelNo: 'ETQDEV002', labelQuantitySac: 1, quantityReturnedSac: 1, receivedCorrectly: '', quantityToStock: 0, quantityToDiscard: 0, operationNotes: '' }
    ],
    operationOpinion: '',
    auditOpinion: 'Atraso na entrega necessita acompanhamento. Não conformidade leve identificada no processo de transporte.',
    auditComplianceLevel: 'low',
    preOpeningSummary: 'Atraso no PED004, cliente está aguardando entrega.',
    preOpeningUserId: 'user-commercial-example2',
    preOpeningUserName: 'Outro Vendedor Comercial',
    preOpeningTimestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'man5', manifestationNo: 'MAN005', clientId: 'client2', clientName: 'João Silva Restaurante ME', branch: 'FIL02', type: 'Reclamação',
    openingDate: staticTwoDaysAgo, status: 'pending', attendantId: 'attendant2', attendantName: 'Ana Souza',
    description: 'Produto PROD_D veio com quantidade menor que o solicitado no PED003.',
    reason: 'Produto Faltando',
    attendantTypedOpinion: 'Cliente alega que recebeu 2 unidades do PROD_D ao invés de 3.',
    attendantOpinion: 'op1', // Falha no processo interno
    recommendedAction: 'Enviar Produto Faltante',
    collectionType: 'Coleta Reversa Agendada',
    collectionReceiptUrl: '',
    slaDueDate: staticPlusTwoDays,
    attachments: [], history: [
        {id: 'hist7', timestamp: staticTwoDaysAgo, action: 'Manifestação aberta', userId: 'client2', userName: 'João Silva Restaurante ME'},
    ],
    productsForReturn: [],
    comodatos: mockClients.find(c => c.id === 'client2')?.comodatos || [],
    creditGranted: 'yes',
    creditReasonAttendant: 'Produto faltante, será enviado item complementar. Crédito parcial para compensar.',
    creditStatusFinance: 'pending',
    creditReasonFinance: '',
    operationReceivedItems: [],
    operationOpinion: '',
    auditOpinion: '',
    auditComplianceLevel: 'not_evaluated',
  }
];

export const mockParameterItems: ParameterItem[] = [
  { id: 'reason1', name: 'Produto Defeituoso', type: 'reason', isActive: true },
  { id: 'reason2', name: 'Atraso na Entrega', type: 'reason', isActive: true },
  { id: 'reason3', name: 'Informação Produto/Serviço', type: 'reason', isActive: true },
  { id: 'reason4', name: 'Atendimento', type: 'reason', isActive: true },
  { id: 'reason5', name: 'Produto Faltando', type: 'reason', isActive: true },
  { id: 'action1', name: 'Trocar Produto', type: 'recommendedAction', isActive: true },
  { id: 'action2', name: 'Reembolsar Cliente', type: 'recommendedAction', isActive: true },
  { id: 'action3', name: 'Enviar Voucher Desconto', type: 'recommendedAction', isActive: false },
  { id: 'action4', name: 'Agilizar Entrega com Transportadora', type: 'recommendedAction', isActive: true },
  { id: 'action5', name: 'Enviar Produto Faltante', type: 'recommendedAction', isActive: true },
  { id: 'action6', name: 'Garantia (BNF)', type: 'recommendedAction', isActive: true },
  { id: 'action7', name: 'Cortesia (BNF)', type: 'recommendedAction', isActive: true },
  { id: 'collect1', name: 'Coleta Reversa Agendada', type: 'collectionType', isActive: true },
  { id: 'collect2', name: 'Postagem em Agência Correios', type: 'collectionType', isActive: true },
  { id: 'collect3', name: 'Não Aplicável', type: 'collectionType', isActive: true },
  { id: 'collect4', name: 'Entrega Direta com Atraso', type: 'collectionType', isActive: true },
  { id: 'op1', name: 'Falha no processo interno', type: 'attendantOpinionOption', isActive: true },
  { id: 'op2', name: 'Problema com transportadora', type: 'attendantOpinionOption', isActive: true },
  { id: 'op3', name: 'Erro do cliente', type: 'attendantOpinionOption', isActive: true },
  { id: 'op4', name: 'Defeito de fabricação', type: 'attendantOpinionOption', isActive: true },
  { id: 'op5', name: 'Outros (especificar)', type: 'attendantOpinionOption', isActive: true },
  // User Roles for Parameters App
  { id: 'role-sac', name: 'SAC', type: 'userRole', isActive: true },
  { id: 'role-fin', name: 'Financeiro', type: 'userRole', isActive: true },
  { id: 'role-ops', name: 'Operação', type: 'userRole', isActive: true },
  { id: 'role-log', name: 'Logística', type: 'userRole', isActive: true },
  { id: 'role-adm', name: 'Administrador', type: 'userRole', isActive: true },
  { id: 'role-ti', name: 'TI', type: 'userRole', isActive: true },
  { id: 'role-att', name: 'Atendente', type: 'userRole', isActive: true },
];

export const mockDynamicFieldMappings: DynamicFieldMapping[] = [
  { id: 'map1', applicationField: 'ManifestationReason', description: 'Motivos da Manifestação', oracleTable: 'TBL_MOTIVOS_MANIFESTACAO', oracleValueColumn: 'COD_MOTIVO', oracleDisplayColumn: 'DESC_MOTIVO', isActive: true },
  { id: 'map2', applicationField: 'CollectionType', description: 'Tipos de Coleta de Devolução', oracleTable: 'TBL_TIPOS_COLETA', oracleValueColumn: 'ID_TIPO_COLETA', oracleDisplayColumn: 'NOME_TIPO_COLETA', isActive: true },
  { id: 'map3', applicationField: 'ProductCategory', description: 'Categorias de Produto', oracleTable: 'TBL_CATEGORIAS_PRODUTO', oracleValueColumn: 'CAT_ID', oracleDisplayColumn: 'CAT_NOME', isActive: false },
];

export const mockUsers: User[] = [
    { id: 'user-admin-test', displayName: 'Bluetech IA Admin', email: 'bluetechfilms.ia@gmail.com', role: 'administrator', isActive: true, photoURL: 'https://placehold.co/40x40/FFD700/000000?text=BA' },
    { id: 'user1', displayName: 'Alice Admin', email: 'alice@example.com', role: 'administrator', isActive: true },
    { id: 'user2', displayName: 'Bob Atendente', email: 'bob@example.com', role: 'attendant', isActive: true },
    { id: 'user3', displayName: 'Charlie TI', email: 'charlie@example.com', role: 'ti', isActive: true },
    { id: 'user4', displayName: 'Diana SAC', email: 'diana@example.com', role: 'sac', isActive: true },
    { id: 'user5', displayName: 'Edward Financeiro', email: 'edward@example.com', role: 'finance', isActive: false },
    { id: 'user6', displayName: 'Fiona Operação', email: 'fiona@example.com', role: 'operation', isActive: true },
    { id: 'user7', displayName: 'George Logística', email: 'george@example.com', role: 'logistics', isActive: true },
];


mockOrders.forEach(order => {
  order.items.forEach(item => {
    if (!item.orderNo) {
      item.orderNo = order.orderNo;
    }
  });
});
mockManifestations.forEach(manif => {
    const client = mockClients.find(c => c.id === manif.clientId);
    if (client && client.comodatos) {
        manif.comodatos = client.comodatos;
    } else {
        manif.comodatos = [];
    }
    if (!manif.operationReceivedItems || manif.operationReceivedItems.length === 0) {
        manif.operationReceivedItems = (manif.productsForReturn || []).map(pfr => ({
            id: `opitem-${Date.now()}-${pfr.productId}-${Math.random().toString(36).substring(7)}`,
            productId: pfr.productId,
            productName: pfr.productName,
            labelNo: pfr.labelNo,
            labelQuantitySac: pfr.labelQuantity,
            quantityReturnedSac: pfr.quantityToReturn,
            receivedCorrectly: manif.id === 'man1' && pfr.productId === 'PROD_A' ? 'yes' : '',
            quantityToStock: manif.id === 'man1' && pfr.productId === 'PROD_A' ? pfr.quantityToReturn : 0,
            quantityToDiscard: 0,
            operationNotes: manif.id === 'man1' && pfr.productId === 'PROD_A' ? 'Recebido conforme.' : '',
        }));
    } else {
         manif.operationReceivedItems = manif.operationReceivedItems.map(opItem => ({
            ...opItem,
            productId: opItem.productId || 'N/A',
            productName: opItem.productName || 'N/A',
            labelNo: opItem.labelNo || 'N/A',
            labelQuantitySac: opItem.labelQuantitySac || 0,
            quantityReturnedSac: opItem.quantityReturnedSac || 0,
            receivedCorrectly: opItem.receivedCorrectly || '',
            quantityToStock: opItem.quantityToStock || 0,
            quantityToDiscard: opItem.quantityToDiscard || 0,
            operationNotes: opItem.operationNotes || '',
        }));
    }
    if (manif.collectionReceiptUrl === undefined) {
        manif.collectionReceiptUrl = '';
    }
    if (manif.collectionScheduledCarrier === undefined) manif.collectionScheduledCarrier = '';
    if (manif.collectionReturnInvoice === undefined) manif.collectionReturnInvoice = '';
    if (manif.collectionScheduledDate === undefined) manif.collectionScheduledDate = '';
    if (manif.collectionScheduledPeriod === undefined) manif.collectionScheduledPeriod = '';
    if (manif.collectionScheduledNotes === undefined) manif.collectionScheduledNotes = '';


});
mockParameterItems.forEach(param => {
  if (param.type === 'userRole') {
    const roleKey = param.name.toLowerCase().replace(/\s+/g, '') as UserRole;
    const existingUser = mockUsers.find(u => u.role === roleKey);
    if (!existingUser && mockUsers.length < 10) {
       // mockUsers.push({ id: `user-mock-${param.id}`, displayName: `${param.name} User`, email: `${roleKey}@example.com`, role: roleKey, isActive: true });
    }
  }
});
const allDefinedRoles: UserRole[] = ['attendant', 'administrator', 'ti', 'sac', 'finance', 'operation', 'logistics'];
allDefinedRoles.forEach(role => {
    if (!mockUsers.some(u => u.role === role) && mockUsers.length < 12) {
        mockUsers.push({ id: `user-default-${role}`, displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} Default`, email: `${role}@example.com`, role: role, isActive: true });
    }
});

mockUsers.forEach(user => {
  if (!user.photoURL) {
    const initials = (user.displayName?.split(' ').map(n => n[0]).join('') || 'UU').substring(0,2).toUpperCase();
    user.photoURL = `https://placehold.co/40x40/A9A9A9/FFFFFF?text=${initials}`;
  }
});

    
