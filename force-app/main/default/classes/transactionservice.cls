public with sharing class transactionservice {

   @AuraEnabled
   public static List<Member__c> getTransactions(Id familyId) {
   return [
            SELECT
            Id,
            Name,
        ( SELECT
          Id,
          amount__c,
          type__c,
          paid__c,
          payment_date__c

          FROM transactions__r
        )
         FROM Member__c
         WHERE family__c = :familyId
    ];
}
    @AuraEnabled
    public static void createTransaction(

    Id memberId,
    Decimal amount,
    Date paymentDate,
    String typeValue
     )
 {

    Integer currentMonth = paymentDate.month();
    Integer currentYear = paymentDate.year();

    List<Transaction__c> existingTransaction = [
        SELECT Id
        FROM Transaction__c
        WHERE member__c = :memberId
        AND type__c = :typeValue
        AND CALENDAR_MONTH(payment_date__c) = :currentMonth
        AND CALENDAR_YEAR(payment_date__c) = :currentYear
        LIMIT 1
    ];
    
    // EMI LOAN VALIDATION
        if(typeValue == 'EMI') {

            List<loan__c> loans = [

                SELECT
                    Id,
                    Status__c,
                    Remaining_EMI__c

                FROM loan__c

                WHERE member__c = :memberId
                AND Status__c = 'Active'

                LIMIT 1
        ];

        // NO ACTIVE LOAN
        if(loans.isEmpty()) {

            throw new AuraHandledException(
                'No active loan found'
            );
        }

        loan__c loanObj = loans[0];

        // LOAN CLOSED
        if(loanObj.Remaining_EMI__c <= 0) {

            throw new AuraHandledException(
                'Loan already closed'
            );
        }
    }
     // VALIDATION
        if(!existingTransaction.isEmpty()) {

            throw new AuraHandledException(
                'Payment has already been completed for this month'
            );
        }

        Transaction__c txn = new Transaction__c();

        txn.member__c = memberId;

        txn.amount__c = amount;

        txn.payment_date__c = paymentDate;

        txn.type__c = typeValue;

        txn.paid__c = true;

        insert txn;
    }
}