public with sharing class Loanservice {

    @AuraEnabled
    public static void ApplyLoan(
        Id memberId,
        Decimal loanAmount,
        Date loanDate
        )
   {

        // CHECK ACTIVE LOAN
        List<loan__c> existingLoan = [

            SELECT Id
            FROM loan__c
            WHERE member__c = :memberId
            AND Status__c = 'Active'
            LIMIT 1
        ];

        if(!existingLoan.isEmpty()) {

            throw new AuraHandledException(
                'Member already has active loan'
            );
        }

        // CREATE LOAN
        loan__c loanObj = new loan__c();

        loanObj.member__c = memberId;

        loanObj.loan_amount__c = loanAmount;

        loanObj.paper_fee__c = 200;

        loanObj.Loan_date__c = loanDate;

        loanObj.Status__c = 'Active';

        loanObj.Remaining_EMI__c = 24;

        Decimal totalAmount = loanAmount + 200;

        loanObj.EMI_amount__c = (loanAmount + 200) / 24;

        insert loanObj;
    }

    @AuraEnabled(cacheable=true)
    public static List<loan__c> getLoans(Id familyId) {

    return [

        SELECT
            Id,
            member__r.Name,
            loan_amount__c,
            Total_amount__c,
            EMI_amount__c,
            Loan_date__c,
            paid_EMI__c,
            Remaining_EMI__c,
            Status__c

        FROM loan__c

        WHERE member__r.family__c = :familyId

        ORDER BY CreatedDate DESC
    ];
}

    @AuraEnabled(cacheable=true)
    public static Decimal getEMIAmount(Id memberId) {

    List<loan__c> loanList = [

        SELECT
            loan_amount__c,
            Remaining_EMI__c,
            Status__c,
            EMI_amount__c

        FROM loan__c

        WHERE member__c = :memberId
        AND Status__c = 'Active'

        LIMIT 1
    ];

        if(loanList.isEmpty()) {

            throw new AuraHandledException(
                'No active loan found'
            );
        }

        loan__c loanRecord = loanList[0];

        if(
            loanRecord.Remaining_EMI__c > 0 &&
            loanRecord.Status__c == 'Active'
        ) {

            return loanRecord.EMI_amount__c;
        }

        throw new AuraHandledException(
            'No active loan is found'
        );
        }
    @AuraEnabled
    public static void updateLoanEMI(Id memberId) {

        List<loan__c> loans = [

                SELECT
                    Id,
                    Remaining_EMI__c,
                    Status__c

                FROM loan__c

                WHERE member__c = :memberId
                AND Status__c = 'Active'

                LIMIT 1
            ];

        if(!loans.isEmpty()) {

            loan__c loanObj = loans[0];

            // REDUCE EMI
            loanObj.Remaining_EMI__c =
                loanObj.Remaining_EMI__c - 1;
                

            // AUTO CLOSE
            if(loanObj.Remaining_EMI__c <= 0) {

                loanObj.Status__c = 'Closed';

                loanObj.Remaining_EMI__c = 0;
            }

            update loanObj;
        }
}
}