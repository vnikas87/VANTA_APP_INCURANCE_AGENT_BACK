-- CreateTable
CREATE TABLE "partners" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "greekLabel" TEXT DEFAULT 'Συνεργάτης',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "greekLabel" TEXT DEFAULT 'Εταιρεία',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_branches" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "greekLabel" TEXT DEFAULT 'Κλάδος',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "greekLabel" TEXT DEFAULT 'Σύμβαση',
    "companyId" INTEGER,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "greekLabel" TEXT DEFAULT 'Είδος Παραστατικού',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "greekLabel" TEXT DEFAULT 'Είδος Παραγωγής',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_frequencies" (
    "id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL,
    "name" TEXT,
    "greekLabel" TEXT DEFAULT 'Συχνότητα Πληρωμής',
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_frequencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT,
    "greekFirstName" TEXT DEFAULT 'Όνομα',
    "greekLastName" TEXT DEFAULT 'Επώνυμο',
    "phone" TEXT,
    "mobilePhone" TEXT,
    "email" TEXT,
    "taxNumber" TEXT,
    "notes" TEXT,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" SERIAL NOT NULL,
    "policyNumber" TEXT,
    "identifier" TEXT,
    "customerId" INTEGER NOT NULL,
    "partnerId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "contractTypeId" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_transactions" (
    "id" SERIAL NOT NULL,
    "policyId" INTEGER NOT NULL,
    "applicationDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "documentTypeId" INTEGER,
    "productionTypeId" INTEGER,
    "paymentFrequencyId" INTEGER,
    "insuranceYear" INTEGER,
    "installmentNumber" INTEGER,
    "remarks" TEXT,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_financials" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "annualNetAmount" DECIMAL(12,2),
    "annualGrossAmount" DECIMAL(12,2),
    "installmentNetAmount" DECIMAL(12,2),
    "installmentGrossAmount" DECIMAL(12,2),
    "contractRate" DECIMAL(8,4),
    "contractCommission" DECIMAL(12,2),
    "incomingCommission" DECIMAL(12,2),
    "performanceRate" DECIMAL(8,4),
    "performanceAmount" DECIMAL(12,2),
    "differenceAmount" DECIMAL(12,2),
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_financials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_notes" (
    "id" SERIAL NOT NULL,
    "policyId" INTEGER,
    "transactionId" INTEGER,
    "noteType" TEXT,
    "text" TEXT NOT NULL,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_code_key" ON "partners"("code");

-- CreateIndex
CREATE INDEX "partners_name_idx" ON "partners"("name");

-- CreateIndex
CREATE INDEX "partners_createdId_idx" ON "partners"("createdId");

-- CreateIndex
CREATE INDEX "partners_updatedId_idx" ON "partners"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_code_key" ON "insurance_companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_name_key" ON "insurance_companies"("name");

-- CreateIndex
CREATE INDEX "insurance_companies_name_idx" ON "insurance_companies"("name");

-- CreateIndex
CREATE INDEX "insurance_companies_createdId_idx" ON "insurance_companies"("createdId");

-- CreateIndex
CREATE INDEX "insurance_companies_updatedId_idx" ON "insurance_companies"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_branches_code_key" ON "insurance_branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_branches_name_key" ON "insurance_branches"("name");

-- CreateIndex
CREATE INDEX "insurance_branches_name_idx" ON "insurance_branches"("name");

-- CreateIndex
CREATE INDEX "insurance_branches_createdId_idx" ON "insurance_branches"("createdId");

-- CreateIndex
CREATE INDEX "insurance_branches_updatedId_idx" ON "insurance_branches"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_code_key" ON "contract_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_name_key" ON "contract_types"("name");

-- CreateIndex
CREATE INDEX "contract_types_name_idx" ON "contract_types"("name");

-- CreateIndex
CREATE INDEX "contract_types_companyId_idx" ON "contract_types"("companyId");

-- CreateIndex
CREATE INDEX "contract_types_createdId_idx" ON "contract_types"("createdId");

-- CreateIndex
CREATE INDEX "contract_types_updatedId_idx" ON "contract_types"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_code_key" ON "document_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE INDEX "document_types_name_idx" ON "document_types"("name");

-- CreateIndex
CREATE INDEX "document_types_createdId_idx" ON "document_types"("createdId");

-- CreateIndex
CREATE INDEX "document_types_updatedId_idx" ON "document_types"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "production_types_code_key" ON "production_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "production_types_name_key" ON "production_types"("name");

-- CreateIndex
CREATE INDEX "production_types_name_idx" ON "production_types"("name");

-- CreateIndex
CREATE INDEX "production_types_createdId_idx" ON "production_types"("createdId");

-- CreateIndex
CREATE INDEX "production_types_updatedId_idx" ON "production_types"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_frequencies_value_key" ON "payment_frequencies"("value");

-- CreateIndex
CREATE INDEX "payment_frequencies_createdId_idx" ON "payment_frequencies"("createdId");

-- CreateIndex
CREATE INDEX "payment_frequencies_updatedId_idx" ON "payment_frequencies"("updatedId");

-- CreateIndex
CREATE INDEX "customers_lastName_idx" ON "customers"("lastName");

-- CreateIndex
CREATE INDEX "customers_firstName_idx" ON "customers"("firstName");

-- CreateIndex
CREATE INDEX "customers_createdId_idx" ON "customers"("createdId");

-- CreateIndex
CREATE INDEX "customers_updatedId_idx" ON "customers"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "policies_policyNumber_key" ON "policies"("policyNumber");

-- CreateIndex
CREATE INDEX "policies_customerId_idx" ON "policies"("customerId");

-- CreateIndex
CREATE INDEX "policies_partnerId_idx" ON "policies"("partnerId");

-- CreateIndex
CREATE INDEX "policies_companyId_idx" ON "policies"("companyId");

-- CreateIndex
CREATE INDEX "policies_branchId_idx" ON "policies"("branchId");

-- CreateIndex
CREATE INDEX "policies_contractTypeId_idx" ON "policies"("contractTypeId");

-- CreateIndex
CREATE INDEX "policies_startDate_idx" ON "policies"("startDate");

-- CreateIndex
CREATE INDEX "policies_endDate_idx" ON "policies"("endDate");

-- CreateIndex
CREATE INDEX "policies_createdId_idx" ON "policies"("createdId");

-- CreateIndex
CREATE INDEX "policies_updatedId_idx" ON "policies"("updatedId");

-- CreateIndex
CREATE INDEX "policy_transactions_policyId_idx" ON "policy_transactions"("policyId");

-- CreateIndex
CREATE INDEX "policy_transactions_documentTypeId_idx" ON "policy_transactions"("documentTypeId");

-- CreateIndex
CREATE INDEX "policy_transactions_productionTypeId_idx" ON "policy_transactions"("productionTypeId");

-- CreateIndex
CREATE INDEX "policy_transactions_paymentFrequencyId_idx" ON "policy_transactions"("paymentFrequencyId");

-- CreateIndex
CREATE INDEX "policy_transactions_applicationDate_idx" ON "policy_transactions"("applicationDate");

-- CreateIndex
CREATE INDEX "policy_transactions_issueDate_idx" ON "policy_transactions"("issueDate");

-- CreateIndex
CREATE INDEX "policy_transactions_deliveryDate_idx" ON "policy_transactions"("deliveryDate");

-- CreateIndex
CREATE INDEX "policy_transactions_createdId_idx" ON "policy_transactions"("createdId");

-- CreateIndex
CREATE INDEX "policy_transactions_updatedId_idx" ON "policy_transactions"("updatedId");

-- CreateIndex
CREATE INDEX "policy_financials_transactionId_idx" ON "policy_financials"("transactionId");

-- CreateIndex
CREATE INDEX "policy_financials_createdId_idx" ON "policy_financials"("createdId");

-- CreateIndex
CREATE INDEX "policy_financials_updatedId_idx" ON "policy_financials"("updatedId");

-- CreateIndex
CREATE INDEX "policy_notes_policyId_idx" ON "policy_notes"("policyId");

-- CreateIndex
CREATE INDEX "policy_notes_transactionId_idx" ON "policy_notes"("transactionId");

-- CreateIndex
CREATE INDEX "policy_notes_createdId_idx" ON "policy_notes"("createdId");

-- CreateIndex
CREATE INDEX "policy_notes_updatedId_idx" ON "policy_notes"("updatedId");

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies" ADD CONSTRAINT "insurance_companies_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies" ADD CONSTRAINT "insurance_companies_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_branches" ADD CONSTRAINT "insurance_branches_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_branches" ADD CONSTRAINT "insurance_branches_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_types" ADD CONSTRAINT "contract_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_types" ADD CONSTRAINT "contract_types_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_types" ADD CONSTRAINT "contract_types_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_types" ADD CONSTRAINT "production_types_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_types" ADD CONSTRAINT "production_types_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_frequencies" ADD CONSTRAINT "payment_frequencies_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_frequencies" ADD CONSTRAINT "payment_frequencies_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "insurance_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_contractTypeId_fkey" FOREIGN KEY ("contractTypeId") REFERENCES "contract_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_transactions" ADD CONSTRAINT "policy_transactions_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_transactions" ADD CONSTRAINT "policy_transactions_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_transactions" ADD CONSTRAINT "policy_transactions_productionTypeId_fkey" FOREIGN KEY ("productionTypeId") REFERENCES "production_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_transactions" ADD CONSTRAINT "policy_transactions_paymentFrequencyId_fkey" FOREIGN KEY ("paymentFrequencyId") REFERENCES "payment_frequencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_transactions" ADD CONSTRAINT "policy_transactions_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_transactions" ADD CONSTRAINT "policy_transactions_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_financials" ADD CONSTRAINT "policy_financials_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "policy_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_financials" ADD CONSTRAINT "policy_financials_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_financials" ADD CONSTRAINT "policy_financials_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "policy_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
