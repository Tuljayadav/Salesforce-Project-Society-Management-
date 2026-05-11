public with sharing class transactionservice {

    @AuraEnabled(cacheable=true)

    public static List<transaction__c> getTransactions(Id familyId) {

        return [

            SELECT Id,
                   Name,
                   amount__c,
                   type__c,
                   month__c,
                   year__c,
                   paid__c,
                   payment_date__c,
                   member__r.Name

            FROM transaction__c

            WHERE member__r.Family__c = :familyId

            ORDER BY CreatedDate DESC
        ];
    }
}